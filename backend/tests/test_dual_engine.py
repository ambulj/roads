import pytest
import os
import asyncio
import tempfile
from sqlalchemy import text
from app.storage.database import (
    normalize_database_url,
    to_sync_database_url,
    create_sqlite_async_engine,
    create_sqlite_sync_engine,
    create_postgres_async_engine,
    create_async_db_engine,
    create_sync_db_engine,
    POSTGRES_CONNECT_ARGS,
    _mask_url_for_logging,
)


def test_url_protocol_normalization():
    """
    Verifies URL protocol normalization:
    - Legacy postgresql:// and postgres:// -> postgresql+asyncpg://
    - Empty or sqlite -> sqlite+aiosqlite:///.../roadsaathi.db
    - sqlite:///... -> sqlite+aiosqlite:///...
    - Already normalized URLs remain unchanged
    """
    # SQLite normalization
    assert normalize_database_url("").startswith("sqlite+aiosqlite:///")
    assert normalize_database_url("sqlite").startswith("sqlite+aiosqlite:///")
    assert normalize_database_url("sqlite3").startswith("sqlite+aiosqlite:///")
    assert normalize_database_url(None).startswith("sqlite+aiosqlite:///")
    assert normalize_database_url("   ").startswith("sqlite+aiosqlite:///")
    
    custom_sqlite = "sqlite:///custom/path/test.db"
    assert normalize_database_url(custom_sqlite) == "sqlite+aiosqlite:///custom/path/test.db"
    
    already_async_sqlite = "sqlite+aiosqlite:///custom/path/test.db"
    assert normalize_database_url(already_async_sqlite) == already_async_sqlite

    # PostgreSQL normalization
    pg_legacy = "postgresql://user:pass@localhost:5432/roadsaathi"
    assert normalize_database_url(pg_legacy) == "postgresql+asyncpg://user:pass@localhost:5432/roadsaathi"
    
    postgres_legacy = "postgres://user:pass@localhost:5432/roadsaathi"
    assert normalize_database_url(postgres_legacy) == "postgresql+asyncpg://user:pass@localhost:5432/roadsaathi"

    pg_async = "postgresql+asyncpg://user:pass@localhost:5432/roadsaathi"
    assert normalize_database_url(pg_async) == pg_async

    # Sync URL transformation
    assert to_sync_database_url(already_async_sqlite) == custom_sqlite
    assert to_sync_database_url(pg_async) == pg_legacy


def test_postgres_engine_args():
    """
    Verifies that PostgreSQL async engines initialize with PgBouncer-safe settings:
    - statement_cache_size=0 and prepared_statement_cache_size=0
    - pool_recycle=300
    - pool_pre_ping=True
    - pool_timeout=10
    - Sensitive credentials are never leaked in logs
    """
    url = "postgresql+asyncpg://admin:super_secret_pw@localhost:5432/roadsaathi_prod"
    engine = create_postgres_async_engine(url)

    # Verify PgBouncer transaction-safe arguments in configuration
    assert POSTGRES_CONNECT_ARGS.get("statement_cache_size") == 0
    assert POSTGRES_CONNECT_ARGS.get("prepared_statement_cache_size") == 0

    # Verify that dialect/pool creator closure received statement_cache_size=0
    creator = engine.sync_engine.pool._creator_arg
    closure_dicts = [c.cell_contents for c in creator.__closure__ if isinstance(c.cell_contents, dict)]
    found_args = {}
    for d in closure_dicts:
        if "statement_cache_size" in d:
            found_args = d
            break
    assert found_args.get("statement_cache_size") == 0
    assert found_args.get("prepared_statement_cache_size") == 0

    # Verify pool configuration
    pool = engine.sync_engine.pool
    assert pool._recycle == 300
    assert pool._pre_ping is True
    assert pool._timeout == 10
    assert pool.size() == 20
    assert pool._max_overflow == 10

    # Verify credential masking (T-01-01)
    masked = _mask_url_for_logging(url)
    assert "super_secret_pw" not in masked
    assert "***" in masked or "admin:@" in masked or "admin:***" in masked


def test_sqlite_wal_pragmas():
    """
    Verifies that SQLite connections set:
    - journal_mode=WAL
    - synchronous=NORMAL (returns 1 in SQLite)
    - busy_timeout=15000
    - foreign_keys=ON (returns 1 in SQLite)
    """
    async def _verify_async_pragmas(db_path):
        async_eng = create_sqlite_async_engine(f"sqlite+aiosqlite:///{db_path}")
        async with async_eng.connect() as conn:
            jm_res = await conn.execute(text("PRAGMA journal_mode;"))
            journal_mode = jm_res.scalar()
            sync_res = await conn.execute(text("PRAGMA synchronous;"))
            synchronous = sync_res.scalar()
            bt_res = await conn.execute(text("PRAGMA busy_timeout;"))
            busy_timeout = bt_res.scalar()
            fk_res = await conn.execute(text("PRAGMA foreign_keys;"))
            foreign_keys = fk_res.scalar()

        await async_eng.dispose()
        return journal_mode, synchronous, busy_timeout, foreign_keys

    with tempfile.TemporaryDirectory() as tmpdir:
        db_path = os.path.join(tmpdir, "test_wal.db").replace("\\", "/")
        journal_mode, synchronous, busy_timeout, foreign_keys = asyncio.run(_verify_async_pragmas(db_path))

        assert str(journal_mode).lower() == "wal"
        assert synchronous == 1  # 1 corresponds to NORMAL
        assert busy_timeout == 15000
        assert foreign_keys == 1

        # 2. Verify Sync SQLite Engine Pragmas
        sync_eng = create_sqlite_sync_engine(f"sqlite:///{db_path}")
        with sync_eng.connect() as conn:
            assert str(conn.execute(text("PRAGMA journal_mode;")).scalar()).lower() == "wal"
            assert conn.execute(text("PRAGMA synchronous;")).scalar() == 1
            assert conn.execute(text("PRAGMA busy_timeout;")).scalar() == 15000
            assert conn.execute(text("PRAGMA foreign_keys;")).scalar() == 1

        sync_eng.dispose()
