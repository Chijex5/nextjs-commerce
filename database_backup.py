#!/usr/bin/env python3
"""
Clone PostgreSQL schema (tables, columns, indexes) and data
from a source database URL to a hardcoded target database URL.
"""

from __future__ import annotations

import os
import sys
from contextlib import suppress
from typing import Iterable
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from dotenv import load_dotenv
from sqlalchemy import MetaData, create_engine, inspect, select, text
from sqlalchemy.exc import SQLAlchemyError

TARGET_DATABASE_URL = ""
SOURCE_ENV_KEYS = (
    "SOURCE_DATABASE_URL",
    "DIRECT_DATABASE_URL",
    "DATABASE_URL",
    "POSTGRES_URL",
    "AMAZON_DATABASE_URL",
)
SKIP_SCHEMAS = {"information_schema", "pg_catalog", "pg_toast"}
CHUNK_SIZE = 2_000


def quote_ident(value: str) -> str:
    return '"' + value.replace('"', '""') + '"'


def resolve_source_url() -> str:
    for key in SOURCE_ENV_KEYS:
        value = os.getenv(key)
        if value:
            return value
    raise RuntimeError(
        "No source database URL found. Set one of: "
        + ", ".join(SOURCE_ENV_KEYS)
    )


def validate_target_url(target_url: str) -> None:
    if "username:password@host" in target_url:
        raise RuntimeError(
            "Set TARGET_DATABASE_URL in database_backup.py before running."
        )


def normalize_database_url(database_url: str) -> str:
    parts = urlsplit(database_url)
    scheme = parts.scheme.lower()
    if scheme == "postgres":
        parts = parts._replace(scheme="postgresql")
    elif scheme == "prisma+postgres":
        raise RuntimeError(
            "prisma+postgres URL is not supported for raw backup. "
            "Use a direct PostgreSQL URL (postgresql:// or postgres://)."
        )

    query_pairs = parse_qsl(parts.query, keep_blank_values=True)

    schema_values: list[str] = []
    passthrough_pairs: list[tuple[str, str]] = []
    existing_options: list[str] = []

    for key, value in query_pairs:
        lowered = key.lower()
        if lowered == "schema" and value:
            schema_values.extend(
                [schema.strip() for schema in value.split(",") if schema.strip()]
            )
            continue
        if lowered == "options":
            existing_options.append(value)
            continue
        passthrough_pairs.append((key, value))

    if schema_values:
        options_parts = [opt.strip() for opt in existing_options if opt.strip()]
        options_parts.append(f"-csearch_path={','.join(schema_values)}")
        passthrough_pairs.append(("options", " ".join(options_parts)))
    else:
        passthrough_pairs.extend([("options", opt) for opt in existing_options])

    normalized_query = urlencode(passthrough_pairs, doseq=True)
    return urlunsplit(
        (parts.scheme, parts.netloc, parts.path, normalized_query, parts.fragment)
    )


def get_user_schemas(source_engine) -> list[str]:
    inspector = inspect(source_engine)
    schemas: list[str] = []
    for schema in inspector.get_schema_names():
        if schema in SKIP_SCHEMAS:
            continue
        if schema.startswith("pg_temp_") or schema.startswith("pg_toast_temp_"):
            continue
        schemas.append(schema)
    return schemas


def create_missing_schemas(target_engine, schemas: Iterable[str]) -> None:
    with target_engine.begin() as conn:
        for schema in schemas:
            conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS {quote_ident(schema)}"))


def reset_sequences(target_conn, table) -> None:
    table_ref = f"{table.schema}.{table.name}" if table.schema else table.name
    quoted_table = (
        f"{quote_ident(table.schema)}.{quote_ident(table.name)}"
        if table.schema
        else quote_ident(table.name)
    )

    for column in table.columns:
        if not getattr(column.type, "python_type", None) in (int,):
            continue

        seq_name = target_conn.execute(
            text(
                "SELECT pg_get_serial_sequence(:table_ref, :column_name)"
            ),
            {"table_ref": table_ref, "column_name": column.name},
        ).scalar()

        if not seq_name:
            continue

        quoted_column = quote_ident(column.name)
        max_value = target_conn.execute(
            text(f"SELECT MAX({quoted_column}) FROM {quoted_table}")
        ).scalar()
        is_called = max_value is not None
        next_value = max_value if is_called else 1

        target_conn.execute(
            text(
                "SELECT setval(CAST(:seq_name AS regclass), :next_value, :is_called)"
            ),
            {
                "seq_name": seq_name,
                "next_value": next_value,
                "is_called": is_called,
            },
        )


def copy_table_data(source_conn, target_conn, table) -> int:
    insert_columns = [col for col in table.columns if col.computed is None]
    insert_column_names = {col.name for col in insert_columns}
    insert_stmt = table.insert()

    copied = 0
    batch = []
    result = source_conn.execution_options(stream_results=True).execute(select(table))

    for row in result.mappings():
        payload = {k: v for k, v in row.items() if k in insert_column_names}
        batch.append(payload)
        if len(batch) >= CHUNK_SIZE:
            target_conn.execute(insert_stmt, batch)
            copied += len(batch)
            batch = []

    if batch:
        target_conn.execute(insert_stmt, batch)
        copied += len(batch)

    return copied


def run_backup() -> None:
    load_dotenv(override=False)

    source_url = normalize_database_url(resolve_source_url())
    target_url = normalize_database_url(TARGET_DATABASE_URL)
    validate_target_url(target_url)

    if source_url == target_url:
        raise RuntimeError("Source and target URLs are identical. Aborting.")

    source_engine = create_engine(source_url, pool_pre_ping=True)
    target_engine = create_engine(target_url, pool_pre_ping=True)

    schemas = get_user_schemas(source_engine)
    if not schemas:
        raise RuntimeError("No user schemas found on source database.")

    print(f"Found {len(schemas)} schema(s). Reflecting source metadata...")
    source_metadata = MetaData()
    for schema in schemas:
        source_metadata.reflect(bind=source_engine, schema=schema)

    if not source_metadata.tables:
        raise RuntimeError("No tables found in source metadata.")

    print("Preparing target database...")
    create_missing_schemas(target_engine, schemas)

    target_metadata = MetaData()
    for schema in schemas:
        target_metadata.reflect(bind=target_engine, schema=schema)

    with target_engine.begin() as conn:
        target_metadata.drop_all(bind=conn)
        source_metadata.create_all(bind=conn)

    print(f"Copying data for {len(source_metadata.tables)} table(s)...")
    total_rows = 0
    with source_engine.connect() as source_conn, target_engine.begin() as target_conn:
        for table in source_metadata.sorted_tables:
            row_count = copy_table_data(source_conn, target_conn, table)
            with suppress(Exception):
                reset_sequences(target_conn, table)
            total_rows += row_count
            table_label = f"{table.schema}.{table.name}" if table.schema else table.name
            print(f"  - {table_label}: {row_count} row(s)")

    print(f"Backup complete. Total rows copied: {total_rows}")


def main() -> int:
    try:
        run_backup()
        return 0
    except (RuntimeError, SQLAlchemyError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
