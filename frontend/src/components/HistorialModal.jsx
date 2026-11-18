import { useEffect, useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://faraelectronica-backend.onrender.com";

function HistorialModal({ onClose }) {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [suscripciones, setSuscripciones] = useState([]);

  // suscripciones activas (se cancelan desde acá, sin cobros pendientes)
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    let activo = true;
    fetch(`${API_URL}/api/suscripciones/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (activo && Array.isArray(data)) setSuscripciones(data);
      })
      .catch(() => {});
    return () => {
      activo = false;
    };
  }, []);

  const cancelarSuscripcion = async (id) => {
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`${API_URL}/api/suscripciones/${id}/cancelar/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setSuscripciones((prev) => prev.filter((s) => s.id !== id));
    } catch {
      // si falla se puede volver a intentar
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    fetch(`${API_URL}/api/historial/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo cargar el historial");
        return res.json();
      })
      .then((data) => {
        setOrdenes(data);
        setLoading(false);
      })
      .catch(() => {
        setError("No se pudo cargar tu historial.");
        setLoading(false);
      });
  }, []);

  const colorEstado = (estado) => {
    const c = {
      pagada: "#4caf50",
      pendiente: "#f5c800",
      rechazada: "#ff6b6b",
      preparando: "#4a9eff",
      entregada: "#9c7bff",
      cancelada: "#888",
    };
    return c[estado] || "#fff";
  };

  const fecha = (iso) =>
    new Date(iso).toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        zIndex: 3000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={onClose}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');
        .hist-box { background: linear-gradient(135deg, #111 0%, #1a1a1a 100%); border: 1px solid #2a2a00; border-radius: 12px; padding: 36px; max-width: 560px; width: 100%; position: relative; box-shadow: 0 12px 40px rgba(245,200,0,0.1); max-height: 85vh; display: flex; flex-direction: column; }
        .hist-box::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, #f5c800, transparent); border-radius: 12px 12px 0 0; }
        .hist-titulo { font-family: 'Bebas Neue', sans-serif; font-size: 2rem; color: #f5f5f5; letter-spacing: 0.08em; margin: 0 0 24px; }
        .hist-titulo span { color: #f5c800; }
        .hist-lista { overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px; }
        .hist-orden { background: #0d0d0d; border: 1px solid #222; border-radius: 8px; padding: 16px; }
        .hist-orden-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .hist-orden-id { font-family: 'DM Sans', sans-serif; font-size: 0.78rem; color: #888; }
        .hist-orden-estado { font-family: 'DM Sans', sans-serif; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; padding: 3px 10px; border-radius: 20px; border: 1px solid currentColor; }
        .hist-orden-items { font-family: 'DM Sans', sans-serif; font-size: 0.82rem; color: #bbb; line-height: 1.6; }
        .hist-orden-total { font-family: 'Bebas Neue', sans-serif; font-size: 1.3rem; color: #f5c800; text-align: right; margin-top: 8px; letter-spacing: 0.04em; }
        .hist-vacio { text-align: center; padding: 40px 0; color: #555; font-family: 'DM Sans', sans-serif; }
        .hist-vacio-icon { font-size: 3rem; margin-bottom: 12px; }
        .btn-cerrar-hist { width: 100%; padding: 13px; background: transparent; border: 1px solid #333; color: #888; border-radius: 6px; font-family: 'DM Sans', sans-serif; font-size: 0.85rem; cursor: pointer; transition: all 0.3s; }
        .btn-cerrar-hist:hover { border-color: #555; color: #aaa; }
        .hist-subs { background: #0d0d0d; border: 1px solid #2a2a00; border-radius: 8px; padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; }
        .hist-subs-titulo { font-family: 'Bebas Neue', sans-serif; font-size: 1.15rem; letter-spacing: 0.06em; color: #f5c800; margin: 0; }
        .hist-sub { display: flex; justify-content: space-between; align-items: center; gap: 12px; font-family: 'DM Sans', sans-serif; font-size: 0.82rem; color: #ddd; }
        .hist-sub span { display: block; color: #888; font-size: 0.74rem; margin-top: 2px; }
        .hist-sub-cancelar { flex-shrink: 0; background: transparent; border: 1px solid #444; color: #aaa; border-radius: 20px; padding: 5px 12px; font-family: 'DM Sans', sans-serif; font-size: 0.72rem; cursor: pointer; }
        .hist-sub-cancelar:hover { border-color: #ff6b6b; color: #ff6b6b; }
      `}</style>

      <div className="hist-box" onClick={(e) => e.stopPropagation()}>
        <h2 className="hist-titulo">
          Mis <span>Compras</span>
        </h2>

        <div className="hist-lista">
          {suscripciones.length > 0 && (
            <div className="hist-subs">
              <p className="hist-subs-titulo">Mis suscripciones</p>
              {suscripciones.map((s) => (
                <div className="hist-sub" key={s.id}>
                  <div>
                    <strong>{s.nombre_producto}</strong> x{s.cantidad}
                    <span>
                      Cada {s.frecuencia_dias} días · {s.descuento_pct}% de
                      descuento · próximo pedido:{" "}
                      {fecha(`${s.proxima_fecha}T12:00:00`)}
                    </span>
                  </div>
                  <button
                    className="hist-sub-cancelar"
                    onClick={() => cancelarSuscripcion(s.id)}
                  >
                    Cancelar
                  </button>
                </div>
              ))}
            </div>
          )}
          {loading && <div className="hist-vacio">Cargando...</div>}
          {error && <div className="hist-vacio">{error}</div>}
          {!loading && !error && ordenes.length === 0 && (
            <div className="hist-vacio">
              <div className="hist-vacio-icon">📦</div>
              <p>Aún no tienes compras.</p>
            </div>
          )}

          {ordenes.map((o) => (
            <div className="hist-orden" key={o.id}>
              <div className="hist-orden-head">
                <span className="hist-orden-id">
                  Orden #{o.id} · {fecha(o.created_at)}
                </span>
                <span
                  className="hist-orden-estado"
                  style={{ color: colorEstado(o.estado) }}
                >
                  {o.estado_display}
                </span>
              </div>
              <div className="hist-orden-items">
                {o.items.map((it, i) => (
                  <div key={i}>
                    {it.nombre_producto} x{it.cantidad} — $
                    {it.subtotal.toLocaleString("es-CL")}
                    {it.es_suscripcion && " (suscripción)"}
                  </div>
                ))}
              </div>
              <div className="hist-orden-total">
                Total: ${o.total.toLocaleString("es-CL")}
              </div>
            </div>
          ))}
        </div>

        <button className="btn-cerrar-hist" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
}

export default HistorialModal;
