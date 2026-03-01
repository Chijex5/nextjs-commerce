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
from sqlalchemy import MetaData, create_engine, func, inspect, select, text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

TARGET_DATABASE_URL = "postgresql://user:password@host:port/database?sslmode=require"
SOURCE_ENV_KEYS = (
    "AMAZON_DATABASE_URL",
)
SKIP_SCHEMAS = {"information_schema", "pg_catalog", "pg_toast"}
CHUNK_SIZE = 2_000
VERIFY_ROW_COUNTS = True


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


def create_missing_schemas(target_conn, schemas: Iterable[str]) -> None:
    for schema in schemas:
        target_conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS {quote_ident(schema)}"))


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


def table_label(table) -> str:
    return f"{table.schema}.{table.name}" if table.schema else table.name


def short_integrity_error(exc: IntegrityError) -> str:
    diag = getattr(getattr(exc, "orig", None), "diag", None)
    if diag and getattr(diag, "message_primary", None):
        return str(diag.message_primary)
    first_line = str(getattr(exc, "orig", exc)).splitlines()[0].strip()
    return first_line or "integrity constraint violation"


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


def count_rows(conn, table) -> int:
    return int(conn.execute(select(func.count()).select_from(table)).scalar_one())


def copy_tables_with_retries(source_conn, target_conn, tables) -> int:
    pending_tables = list(tables)
    unresolved_errors: dict[str, str] = {}
    total_rows = 0
    copy_pass = 1
    copied_tables = []

    while pending_tables:
        print(f"Pass {copy_pass}: attempting {len(pending_tables)} table(s)...")
        deferred_tables = []
        progressed = False

        for table in pending_tables:
            label = table_label(table)
            savepoint = target_conn.begin_nested()
            try:
                row_count = copy_table_data(source_conn, target_conn, table)
                with suppress(Exception):
                    reset_sequences(target_conn, table)
                savepoint.commit()
                total_rows += row_count
                copied_tables.append(table)
                progressed = True
                unresolved_errors.pop(label, None)
                print(f"  - {label}: {row_count} row(s)")
            except IntegrityError as exc:
                savepoint.rollback()
                deferred_tables.append(table)
                unresolved_errors[label] = short_integrity_error(exc)
                print(f"  - {label}: deferred ({unresolved_errors[label]})")
            except SQLAlchemyError:
                savepoint.rollback()
                raise

        if not progressed:
            unresolved = [
                f"{table_label(table)} -> {unresolved_errors.get(table_label(table), 'unknown error')}"
                for table in deferred_tables
            ]
            raise RuntimeError(
                "Unable to resolve table insert order due unresolved constraints:\n"
                + "\n".join(unresolved)
            )

        pending_tables = deferred_tables
        copy_pass += 1

    if VERIFY_ROW_COUNTS:
        print("Verifying row counts...")
        for table in copied_tables:
            label = table_label(table)
            source_count = count_rows(source_conn, table)
            target_count = count_rows(target_conn, table)
            if source_count != target_count:
                raise RuntimeError(
                    f"Row count mismatch for {label}: "
                    f"source={source_count}, target={target_count}"
                )
            print(f"  - {label}: verified ({target_count} row(s))")

    return total_rows


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

    tables = sorted(
        source_metadata.tables.values(),
        key=lambda table: ((table.schema or ""), table.name),
    )
    with (
        source_engine.connect().execution_options(isolation_level="REPEATABLE READ") as source_conn,
        target_engine.connect() as target_conn,
    ):
        with source_conn.begin():
            source_conn.execute(text("SET TRANSACTION READ ONLY"))
            with target_conn.begin():
                print("Preparing target database...")
                create_missing_schemas(target_conn, schemas)

                target_metadata = MetaData()
                for schema in schemas:
                    target_metadata.reflect(bind=target_conn, schema=schema)

                target_metadata.drop_all(bind=target_conn)
                source_metadata.create_all(bind=target_conn)

                print(f"Copying data for {len(tables)} table(s)...")
                total_rows = copy_tables_with_retries(source_conn, target_conn, tables)

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
