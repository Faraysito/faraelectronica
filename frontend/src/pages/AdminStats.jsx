import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://faraelectronica-backend.onrender.com";

/**
 * Dashboard de estadísticas con gráficos (Recharts).
 *
 * Consume el endpoint que YA existe en el backend: GET /api/estadisticas/
 * (protegido para staff/admin). Convierte esos números en gráficos vistosos.
 *
 * En un portafolio, una pantalla de métricas con gráficos reales es de lo que
 * más impacto genera en una demo. Mantiene la identidad de la web:
 * fondo negro #0a0a0a, dorado #f5c800, Bebas Neue + DM Sans.
 *
 * Colocar en: frontend/src/pages/AdminStats.jsx
 * Requiere: npm install recharts
 * Añadir una ruta protegida en App.jsx, p.ej. <Route path="/admin/stats" .../>
 * (idealmente verificando que el usuario sea admin antes de mostrarla).
 */

const ORO = "#f5c800";
const VERDE = "#4caf50";
const ROJO = "#ff6b6b";
const AZUL = "#4a9eff";
const VIOLETA = "#9c7bff";
const PALETA = [ORO, VERDE, AZUL, VIOLETA, ROJO];

const clp = (n) => "$" + (n || 0).toLocaleString("es-CL");

function AdminStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    fetch(`${API_URL}/api/estadisticas/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401 || res.status === 403)
          throw new Error("Necesitas permisos de administrador.");
        if (!res.ok) throw new Error("No se pudieron cargar las estadísticas.");
        return res.json();
      })
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  const tarjetas = stats
    ? [
        { label: "Órdenes pagadas", valor: stats.ordenes_pagadas, color: ORO },
        { label: "Ingresos", valor: clp(stats.ingresos_totales), color: VERDE },
        { label: "Utilidad", valor: clp(stats.utilidad_total), color: AZUL },
        {
          label: "Margen",
          valor: `${stats.margen_porcentaje}%`,
          color: VIOLETA,
        },
      ]
    : [];

  const datosRanking = (stats?.mas_vendidos || []).map((p) => ({
    nombre:
      p.nombre_producto?.length > 16
        ? p.nombre_producto.slice(0, 16) + "…"
        : p.nombre_producto,
    unidades: p.unidades,
    ingresos: p.ingresos,
  }));

  const datosTorta = [
    { name: "Utilidad", value: stats?.utilidad_total || 0 },
    { name: "Costo", value: stats?.costo_total || 0 },
  ];

  return (
    <div className="admin-stats">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .admin-stats { background:#0a0a0a; min-height:calc(100vh - 100px); padding:48px 24px; }
        .as-titulo { font-family:'Bebas Neue',sans-serif; font-size:clamp(2rem,5vw,3.4rem); color:#f5f5f5; letter-spacing:0.08em; text-align:center; margin:0 0 4px; }
        .as-titulo span { color:#f5c800; }
        .as-sub { font-family:'DM Sans',sans-serif; font-size:0.82rem; color:#555; letter-spacing:0.15em; text-transform:uppercase; text-align:center; margin:0 0 36px; }
        .as-cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:18px; max-width:1100px; margin:0 auto 36px; }
        .as-card { background:linear-gradient(135deg,#111 0%,#1a1a1a 100%); border:1px solid #222; border-radius:10px; padding:24px; position:relative; overflow:hidden; }
        .as-card::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; }
        .as-card-label { font-family:'DM Sans',sans-serif; font-size:0.72rem; color:#888; text-transform:uppercase; letter-spacing:0.12em; margin:0 0 10px; }
        .as-card-valor { font-family:'Bebas Neue',sans-serif; font-size:2.4rem; letter-spacing:0.02em; margin:0; line-height:1; }
        .as-paneles { display:grid; grid-template-columns:repeat(auto-fit,minmax(320px,1fr)); gap:24px; max-width:1100px; margin:0 auto; }
        .as-panel { background:linear-gradient(135deg,#111 0%,#1a1a1a 100%); border:1px solid #222; border-radius:10px; padding:24px; }
        .as-panel-titulo { font-family:'Bebas Neue',sans-serif; font-size:1.4rem; color:#f5f5f5; letter-spacing:0.05em; margin:0 0 20px; }
        .as-panel-titulo span { color:#f5c800; }
        .as-msg { max-width:600px; margin:60px auto; text-align:center; font-family:'DM Sans',sans-serif; color:#888; background:#111; border:1px solid #222; border-radius:10px; padding:40px; }
        .as-msg.error { border-color:#ff6b6b40; color:#ff8c8c; }
        .as-skel { background:linear-gradient(90deg,#161616 25%,#222 50%,#161616 75%); background-size:200% 100%; animation:asShimmer 1.4s infinite; border-radius:6px; }
        @keyframes asShimmer { 0%{background-position:200% 0;} 100%{background-position:-200% 0;} }
        .as-empty { font-family:'DM Sans',sans-serif; color:#555; text-align:center; padding:40px 0; }
      `}</style>

      <h1 className="as-titulo">
        Panel de <span>Estadísticas</span>
      </h1>
      <p className="as-sub">Ventas y rentabilidad en tiempo real</p>

      {loading && (
        <div className="as-cards">
          {Array.from({ length: 4 }).map((_, i) => (
            <div className="as-card" key={i}>
              <div
                className="as-skel"
                style={{ height: 14, width: "60%", marginBottom: 14 }}
              />
              <div className="as-skel" style={{ height: 32, width: "80%" }} />
            </div>
          ))}
        </div>
      )}

      {error && <div className="as-msg error">{error}</div>}

      {stats && !loading && (
        <>
          <div className="as-cards">
            {tarjetas.map((t) => (
              <div className="as-card" key={t.label}>
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: t.color,
                  }}
                />
                <p className="as-card-label">{t.label}</p>
                <p className="as-card-valor" style={{ color: t.color }}>
                  {t.valor}
                </p>
              </div>
            ))}
          </div>

          <div className="as-paneles">
            <div className="as-panel">
              <h2 className="as-panel-titulo">
                Más <span>vendidos</span> (unidades)
              </h2>
              {datosRanking.length === 0 ? (
                <p className="as-empty">Aún no hay ventas registradas.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={datosRanking}
                    margin={{ top: 5, right: 10, bottom: 5, left: -10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                    <XAxis
                      dataKey="nombre"
                      tick={{
                        fill: "#888",
                        fontSize: 11,
                        fontFamily: "DM Sans",
                      }}
                      angle={-15}
                      textAnchor="end"
                      height={50}
                    />
                    <YAxis
                      tick={{ fill: "#888", fontSize: 11 }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#0d0d0d",
                        border: "1px solid #f5c80040",
                        borderRadius: 8,
                        fontFamily: "DM Sans",
                      }}
                      labelStyle={{ color: "#f5c800" }}
                      cursor={{ fill: "#f5c80010" }}
                    />
                    <Bar dataKey="unidades" radius={[6, 6, 0, 0]}>
                      {datosRanking.map((_, i) => (
                        <Cell key={i} fill={PALETA[i % PALETA.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="as-panel">
              <h2 className="as-panel-titulo">
                Utilidad vs <span>Costo</span>
              </h2>
              {(stats.ingresos_totales || 0) === 0 ? (
                <p className="as-empty">Aún no hay ingresos registrados.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={datosTorta}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                    >
                      <Cell fill={VERDE} />
                      <Cell fill="#444" />
                    </Pie>
                    <Tooltip
                      formatter={(v) => clp(v)}
                      contentStyle={{
                        background: "#0d0d0d",
                        border: "1px solid #f5c80040",
                        borderRadius: 8,
                        fontFamily: "DM Sans",
                      }}
                    />
                    <Legend
                      wrapperStyle={{
                        fontFamily: "DM Sans",
                        fontSize: 13,
                        color: "#888",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminStats;
