import React, { useState, useEffect } from "react";
import { Panel } from "@/components/Hud";
import { api } from "@/lib/api";
import { Database, Table2, RefreshCw, Leaf } from "lucide-react";

function DataTable({ columns, rows }) {
  if (!rows || !rows.length) return <div style={{ color: "var(--text-dim)" }}>Aucune donnée.</div>;
  const cols = columns && columns.length ? columns : Object.keys(rows[0]);
  return (
    <div style={{ overflow: "auto", maxHeight: 420, border: "1px solid var(--panel-border)", borderRadius: 8 }} data-testid="db-table">
      <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12 }}>
        <thead style={{ position: "sticky", top: 0, background: "rgba(6,12,22,.95)", zIndex: 1 }}>
          <tr>{cols.map((c) => <th key={c} style={{ textAlign: "left", padding: "8px 10px", color: "var(--cyan-bright)", borderBottom: "1px solid var(--panel-border)", whiteSpace: "nowrap", fontFamily: "Orbitron" }}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderBottom: "1px solid rgba(45,130,200,.1)" }}>
              {cols.map((c) => (
                <td key={c} style={{ padding: "7px 10px", color: "var(--text)", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  title={typeof r[c] === "object" ? JSON.stringify(r[c]) : String(r[c] ?? "")}>
                  {typeof r[c] === "object" ? JSON.stringify(r[c]) : String(r[c] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DatabaseView() {
  const [engine, setEngine] = useState("mongo");
  // mongo
  const [dbs, setDbs] = useState([]);
  const [db, setDb] = useState("rebecca");
  const [cols, setCols] = useState([]);
  const [col, setCol] = useState("users");
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  // mysql
  const [tables, setTables] = useState([]);
  const [table, setTable] = useState("utilisateur");
  const [myData, setMyData] = useState(null);
  const [myErr, setMyErr] = useState("");

  const loadMongoDbs = () => api.mongoDbs().then((d) => { if (d.ok) { setDbs(d.databases); setErr(""); } else setErr(d.error); }).catch((e) => setErr(String(e)));
  const loadCols = (dbn) => api.mongoCols(dbn).then((d) => { if (d.ok) setCols(d.collections); }).catch(() => {});
  const loadDocs = (dbn, c) => api.mongoDocs(dbn, c, 200).then((d) => { if (d.ok) { setData(d); setErr(""); } else setErr(d.error); }).catch((e) => setErr(String(e)));
  const loadTables = () => api.mysqlTables().then((d) => { if (d.ok) { setTables(d.tables); setMyErr(""); } else setMyErr(d.error); }).catch((e) => setMyErr(String(e)));
  const loadRows = (t) => api.mysqlRows(t, 200).then((d) => { if (d.ok) { setMyData(d); setMyErr(""); } else setMyErr(d.error); }).catch((e) => setMyErr(String(e)));

  useEffect(() => { loadMongoDbs(); loadCols("rebecca"); loadDocs("rebecca", "users"); }, []);
  useEffect(() => { if (engine === "mysql" && !tables.length) { loadTables(); loadRows("utilisateur"); } }, [engine]);

  return (
    <div className="flex flex-col gap-4" style={{ height: "100%", overflowY: "auto" }}>
      <div className="flex gap-2">
        <button className={`btn ${engine === "mongo" ? "" : ""}`} onClick={() => setEngine("mongo")}
          style={{ opacity: engine === "mongo" ? 1 : 0.5 }} data-testid="db-engine-mongo"><Leaf size={13} className="inline mr-1" /> MongoDB</button>
        <button className="btn" onClick={() => setEngine("mysql")} style={{ opacity: engine === "mysql" ? 1 : 0.5 }} data-testid="db-engine-mysql"><Database size={13} className="inline mr-1" /> MySQL</button>
      </div>

      {engine === "mongo" ? (
        <Panel title={<><Leaf size={13} /> MongoDB — {db}.{col}</>} testid="db-mongo"
          right={<button onClick={() => loadDocs(db, col)} style={{ color: "var(--cyan-bright)" }}><RefreshCw size={14} /></button>}>
          <div className="flex gap-2 mb-3">
            <select className="field" value={db} onChange={(e) => { setDb(e.target.value); loadCols(e.target.value); }} data-testid="mongo-db-select">
              {[...new Set([db, ...dbs])].map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <select className="field" value={col} onChange={(e) => { setCol(e.target.value); loadDocs(db, e.target.value); }} data-testid="mongo-col-select">
              {[...new Set([col, ...cols])].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {err && <div style={{ color: "var(--red-soft)", fontSize: 12, marginBottom: 8 }}>⚠ {err}</div>}
          {data && <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 6 }}>{data.total} documents · {data.rows.length} affichés</div>}
          <DataTable columns={data?.columns} rows={data?.rows} />
        </Panel>
      ) : (
        <Panel title={<><Database size={13} /> MySQL — {table}</>} testid="db-mysql"
          right={<button onClick={() => loadRows(table)} style={{ color: "var(--cyan-bright)" }}><RefreshCw size={14} /></button>}>
          <div className="flex gap-2 mb-3">
            <select className="field" value={table} onChange={(e) => { setTable(e.target.value); loadRows(e.target.value); }} data-testid="mysql-table-select">
              {[...new Set([table, ...tables])].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <button className="btn" onClick={loadTables}><Table2 size={13} className="inline mr-1" /> Tables</button>
          </div>
          {myErr && <div style={{ color: "var(--red-soft)", fontSize: 12, marginBottom: 8 }}>⚠ {myErr}<div style={{ color: "var(--text-dim)", marginTop: 4 }}>MySQL Hostpoint est interne : accessible uniquement quand le backend tourne sur le réseau Hostpoint.</div></div>}
          <DataTable columns={myData?.columns} rows={myData?.rows} />
        </Panel>
      )}
    </div>
  );
}
