"""Browse external databases: MongoDB (Atlas) and MySQL (Hostpoint)."""
import os
from motor.motor_asyncio import AsyncIOMotorClient

_ext_mongo = None


def _mongo():
    global _ext_mongo
    uri = os.environ.get("EXTERNAL_MONGO_URL")
    if not uri:
        return None
    if _ext_mongo is None:
        _ext_mongo = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=8000)
    return _ext_mongo


def _clean(doc: dict) -> dict:
    out = {}
    for k, v in doc.items():
        out[k] = str(v) if k == "_id" else v
    return out


async def mongo_databases():
    cli = _mongo()
    if cli is None:
        return {"ok": False, "error": "EXTERNAL_MONGO_URL non configuré"}
    try:
        names = await cli.list_database_names()
        return {"ok": True, "databases": [n for n in names if n not in ("admin", "local", "config")]}
    except Exception as e:
        return {"ok": False, "error": str(e)}


async def mongo_collections(db: str):
    cli = _mongo()
    if cli is None:
        return {"ok": False, "error": "non configuré"}
    try:
        cols = await cli[db].list_collection_names()
        return {"ok": True, "database": db, "collections": sorted(cols)}
    except Exception as e:
        return {"ok": False, "error": str(e)}


async def mongo_docs(db: str, collection: str, limit: int = 100, skip: int = 0):
    cli = _mongo()
    if cli is None:
        return {"ok": False, "error": "non configuré"}
    try:
        cur = cli[db][collection].find({}).skip(skip).limit(min(limit, 500))
        docs = [_clean(d) async for d in cur]
        total = await cli[db][collection].estimated_document_count()
        cols = sorted({k for d in docs for k in d.keys()})
        return {"ok": True, "database": db, "collection": collection,
                "columns": cols, "rows": docs, "total": total}
    except Exception as e:
        return {"ok": False, "error": str(e)}


def _mysql_conn():
    import pymysql
    return pymysql.connect(
        host=os.environ.get("MYSQL_HOST", ""),
        port=int(os.environ.get("MYSQL_PORT", "3306")),
        user=os.environ.get("MYSQL_USER", ""),
        password=os.environ.get("MYSQL_PASSWORD", ""),
        database=os.environ.get("MYSQL_DB", "") or None,
        connect_timeout=8, cursorclass=__import__("pymysql").cursors.DictCursor,
    )


def mysql_tables():
    try:
        conn = _mysql_conn()
        with conn.cursor() as cur:
            cur.execute("SHOW TABLES")
            rows = cur.fetchall()
            tables = [list(r.values())[0] for r in rows]
        conn.close()
        return {"ok": True, "tables": tables}
    except Exception as e:
        return {"ok": False, "error": str(e)}


def mysql_rows(table: str, limit: int = 100):
    try:
        safe = "".join(c for c in table if c.isalnum() or c in ("_",))
        conn = _mysql_conn()
        with conn.cursor() as cur:
            cur.execute(f"SELECT * FROM `{safe}` LIMIT %s", (min(limit, 500),))
            rows = cur.fetchall()
            cols = [d[0] for d in cur.description] if cur.description else []
        conn.close()
        for r in rows:
            for k, v in list(r.items()):
                if not isinstance(v, (str, int, float, bool, type(None))):
                    r[k] = str(v)
        return {"ok": True, "table": safe, "columns": cols, "rows": rows}
    except Exception as e:
        return {"ok": False, "error": str(e)}
