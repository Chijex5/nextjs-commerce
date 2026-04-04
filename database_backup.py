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
from sqlalchemy import (
    ForeignKeyConstraint,
    MetaData,
    bindparam,
    create_engine,
    func,
    inspect,
    select,
    text,
)
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

TARGET_DATABASE_URL = "postgresql://user:password@host:port/dbname?sslmode=require"
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


def detach_reflected_indexes(metadata: MetaData) -> None:
    for table in metadata.tables.values():
        table.indexes.clear()


def detach_reflected_foreign_keys(metadata: MetaData) -> None:
    for table in metadata.tables.values():
        fk_constraints = [
            constraint
            for constraint in list(table.constraints)
            if isinstance(constraint, ForeignKeyConstraint)
        ]
        for constraint in fk_constraints:
            table.constraints.discard(constraint)

        for column in table.columns:
            for foreign_key in list(column.foreign_keys):
                column.foreign_keys.discard(foreign_key)


def fetch_foreign_key_drop_statements(target_conn, schemas: list[str]) -> list[str]:
    if not schemas:
        return []

    query = text(
        """
        SELECT format(
            'ALTER TABLE %I.%I DROP CONSTRAINT %I',
            ns.nspname,
            table_rel.relname,
            con.conname
        ) AS fk_drop_ddl
        FROM pg_constraint AS con
        JOIN pg_class AS table_rel ON table_rel.oid = con.conrelid
        JOIN pg_namespace AS ns ON ns.oid = table_rel.relnamespace
        WHERE con.contype = 'f'
          AND ns.nspname IN :schemas
        ORDER BY ns.nspname, table_rel.relname, con.conname
        """
    ).bindparams(bindparam("schemas", expanding=True))

    rows = target_conn.execute(query, {"schemas": schemas})
    return [str(row.fk_drop_ddl) for row in rows if row.fk_drop_ddl]


def drop_foreign_keys_on_target(target_conn, schemas: list[str]) -> None:
    drop_statements = fetch_foreign_key_drop_statements(target_conn, schemas)
    if not drop_statements:
        print("No foreign keys to drop before data copy.")
        return

    print(f"Dropping {len(drop_statements)} foreign key constraint(s) before data copy...")
    for drop_ddl in drop_statements:
        target_conn.execute(text(drop_ddl))


def ensure_required_extensions_for_indexes(target_conn, index_definitions: list[str]) -> None:
    required_extensions: set[str] = set()
    for index_ddl in index_definitions:
        ddl_lower = index_ddl.lower()
        if "gin_trgm_ops" in ddl_lower:
            required_extensions.add("pg_trgm")

    for extension in sorted(required_extensions):
        target_conn.execute(
            text(f"CREATE EXTENSION IF NOT EXISTS {quote_ident(extension)}")
        )


def fetch_user_index_definitions(source_conn, schemas: list[str]) -> list[str]:
    if not schemas:
        return []

    query = text(
        """
        SELECT pg_get_indexdef(index_rel.oid) AS index_ddl
        FROM pg_class AS index_rel
        JOIN pg_index AS idx ON idx.indexrelid = index_rel.oid
        JOIN pg_class AS table_rel ON table_rel.oid = idx.indrelid
        JOIN pg_namespace AS ns ON ns.oid = table_rel.relnamespace
        LEFT JOIN pg_constraint AS con ON con.conindid = index_rel.oid
        WHERE ns.nspname IN :schemas
          AND con.oid IS NULL
        ORDER BY ns.nspname, table_rel.relname, index_rel.relname
        """
    ).bindparams(bindparam("schemas", expanding=True))

    rows = source_conn.execute(query, {"schemas": schemas})
    return [str(row.index_ddl) for row in rows if row.index_ddl]


def recreate_indexes_from_source(source_conn, target_conn, schemas: list[str]) -> None:
    index_definitions = fetch_user_index_definitions(source_conn, schemas)
    if not index_definitions:
        print("No secondary indexes to recreate.")
        return

    ensure_required_extensions_for_indexes(target_conn, index_definitions)

    print(f"Recreating {len(index_definitions)} index(es)...")
    for index_ddl in index_definitions:
        target_conn.execute(text(index_ddl))


def fetch_foreign_key_definitions(source_conn, schemas: list[str]) -> list[str]:
    if not schemas:
        return []

    query = text(
        """
        SELECT format(
            'ALTER TABLE %I.%I ADD CONSTRAINT %I %s',
            ns.nspname,
            table_rel.relname,
            con.conname,
            pg_get_constraintdef(con.oid, true)
        ) AS fk_ddl
        FROM pg_constraint AS con
        JOIN pg_class AS table_rel ON table_rel.oid = con.conrelid
        JOIN pg_namespace AS ns ON ns.oid = table_rel.relnamespace
        WHERE con.contype = 'f'
          AND ns.nspname IN :schemas
        ORDER BY ns.nspname, table_rel.relname, con.conname
        """
    ).bindparams(bindparam("schemas", expanding=True))

    rows = source_conn.execute(query, {"schemas": schemas})
    return [str(row.fk_ddl) for row in rows if row.fk_ddl]


def recreate_foreign_keys_from_source(source_conn, target_conn, schemas: list[str]) -> None:
    fk_definitions = fetch_foreign_key_definitions(source_conn, schemas)
    if not fk_definitions:
        print("No foreign keys to recreate.")
        return

    print(f"Recreating {len(fk_definitions)} foreign key constraint(s)...")
    for fk_ddl in fk_definitions:
        target_conn.execute(text(fk_ddl))


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
                detach_reflected_indexes(source_metadata)
                detach_reflected_foreign_keys(source_metadata)
                source_metadata.create_all(bind=target_conn)
                drop_foreign_keys_on_target(target_conn, schemas)

                print(f"Copying data for {len(tables)} table(s)...")
                total_rows = copy_tables_with_retries(source_conn, target_conn, tables)
                recreate_foreign_keys_from_source(source_conn, target_conn, schemas)
                recreate_indexes_from_source(source_conn, target_conn, schemas)

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
