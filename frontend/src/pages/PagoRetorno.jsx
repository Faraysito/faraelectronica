import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCarrito } from "../context/CarritoContext";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://faraelectronica-backend.onrender.com";

function PagoRetorno() {
  const [estado, setEstado] = useState("procesando"); // procesando | pagada | rechazada | error
  const [ordenId, setOrdenId] = useState(null);
  const navigate = useNavigate();
  const { vaciarCarrito } = useCarrito();
  const yaConfirmado = useRef(false);

  useEffect(() => {
    if (yaConfirmado.current) return;
    yaConfirmado.current = true;

    // Webpay vuelve con ?token_ws=... en la URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token_ws");

    if (!token) {
      setEstado("error");
      return;
    }

    fetch(`${API_URL}/api/webpay/confirmar/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token_ws: token }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.estado === "pagada") {
          setEstado("pagada");
          setOrdenId(data.orden_id);
          vaciarCarrito();
        } else if (data.estado === "rechazada") {
          setEstado("rechazada");
        } else {
          setEstado("error");
        }
      })
      .catch(() => setEstado("error"));
  }, [vaciarCarrito]);

  const config = {
    procesando: { icon: "⏳", titulo: "Procesando pago...", color: "#f5c800" },
    pagada: { icon: "✅", titulo: "¡Pago exitoso!", color: "#4caf50" },
    rechazada: { icon: "❌", titulo: "Pago rechazado", color: "#ff6b6b" },
    error: { icon: "⚠️", titulo: "Hubo un problema", color: "#ff6b6b" },
  }[estado];

  return (
    <div
      style={{
        background: "#0a0a0a",
        minHeight: "calc(100vh - 100px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');
        .pago-box { background: linear-gradient(135deg, #111 0%, #1a1a1a 100%); border: 1px solid #2a2a00; border-radius: 12px; padding: 48px 40px; max-width: 460px; width: 100%; text-align: center; position: relative; box-shadow: 0 12px 40px rgba(245,200,0,0.1); }
        .pago-box::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, #f5c800, transparent); border-radius: 12px 12px 0 0; }
        .pago-icon { font-size: 3.5rem; margin-bottom: 16px; }
        .pago-titulo { font-family: 'Bebas Neue', sans-serif; font-size: 2.2rem; letter-spacing: 0.06em; margin: 0 0 12px; }
        .pago-texto { font-family: 'DM Sans', sans-serif; font-size: 0.9rem; color: #999; line-height: 1.7; margin: 0 0 28px; }
        .pago-btn { font-family: 'DM Sans', sans-serif; font-size: 0.8rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; background: #f5c800; border: none; color: #000; padding: 13px 28px; border-radius: 6px; cursor: pointer; transition: all 0.3s; }
        .pago-btn:hover { background: #ffd700; box-shadow: 0 4px 16px rgba(245,200,0,0.3); }
      `}</style>

      <div className="pago-box">
        <div className="pago-icon">{config.icon}</div>
        <h1 className="pago-titulo" style={{ color: config.color }}>
          {config.titulo}
        </h1>
        <p className="pago-texto">
          {estado === "procesando" &&
            "Estamos confirmando tu pago con Webpay, espera un momento."}
          {estado === "pagada" &&
            `Tu orden #${ordenId} fue pagada correctamente. Puedes verla en "Mis Compras".`}
          {estado === "rechazada" &&
            "Tu pago no pudo ser procesado. No se realizó ningún cobro. Puedes intentar nuevamente."}
          {estado === "error" &&
            "No pudimos confirmar el pago. Si el dinero fue descontado, contáctanos."}
        </p>
        {estado !== "procesando" && (
          <button className="pago-btn" onClick={() => navigate("/")}>
            Volver al inicio
          </button>
        )}
      </div>
    </div>
  );
}

export default PagoRetorno;
