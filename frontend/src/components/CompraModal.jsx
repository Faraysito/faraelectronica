import { useState } from "react";
import LoginModal from "./LoginModal";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://faraelectronica-backend.onrender.com";

const WSP_NUMERO = "56940261248";

function CompraModal({ producto, onClose }) {
  const [cantidad, setCantidad] = useState(1);
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [pagando, setPagando] = useState(false);
  const [error, setError] = useState(null);

  const hayUsuario = () => !!localStorage.getItem("user");
  const totalLinea = (producto.precio || 0) * cantidad;

  const bajar = () => setCantidad((c) => Math.max(1, c - 1));
  const subir = () => setCantidad((c) => c + 1);

  const handleWebpay = async () => {
    setError(null);
    if (!hayUsuario()) {
      setMostrarLogin(true);
      return;
    }
    setPagando(true);
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`${API_URL}/api/webpay/crear/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items: [{ id: producto.id, cantidad }] }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo iniciar el pago.");
        setPagando(false);
        return;
      }
      const form = document.createElement("form");
      form.method = "POST";
      form.action = data.url;
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = "token_ws";
      input.value = data.token;
      form.appendChild(input);
      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      console.error(err);
      setError("Error de conexión con el servidor.");
      setPagando(false);
    }
  };

  const handleWhatsapp = () => {
    const mensaje = encodeURIComponent(
      `Hola buenas, quisiera comprar: ${producto.nombre} x${cantidad} ($${totalLinea.toLocaleString("es-CL")})`,
    );
    window.open(`https://wa.me/${WSP_NUMERO}?text=${mensaje}`, "_blank");
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.88)",
        zIndex: 3500,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={onClose}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');
        .compra-box { background: linear-gradient(135deg, #111 0%, #1a1a1a 100%); border: 1px solid #2a2a00; border-radius: 12px; padding: 32px; max-width: 440px; width: 100%; position: relative; box-shadow: 0 12px 40px rgba(245,200,0,0.12); }
        .compra-box::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, #f5c800, transparent); border-radius: 12px 12px 0 0; }
        .compra-titulo { font-family: 'Bebas Neue', sans-serif; font-size: 1.8rem; color: #f5f5f5; letter-spacing: 0.06em; margin: 0 0 4px; }
        .compra-nombre { font-family: 'DM Sans', sans-serif; font-size: 0.9rem; color: #f5c800; font-weight: 600; margin: 0 0 22px; }
        .compra-cant-row { display: flex; align-items: center; justify-content: space-between; background: #0d0d0d; border: 1px solid #222; border-radius: 8px; padding: 14px 16px; margin-bottom: 16px; }
        .compra-cant-label { font-family: 'DM Sans', sans-serif; font-size: 0.8rem; color: #888; text-transform: uppercase; letter-spacing: 0.1em; }
        .compra-cant-controles { display: flex; align-items: center; gap: 14px; }
        .cc-btn { width: 32px; height: 32px; background: #1a1a1a; border: 1px solid #333; color: #f5c800; border-radius: 6px; cursor: pointer; font-size: 1.2rem; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .cc-btn:hover { background: #f5c800; color: #000; border-color: #f5c800; }
        .cc-num { font-family: 'DM Sans', sans-serif; font-size: 1.1rem; color: #f5f5f5; min-width: 24px; text-align: center; font-weight: 600; }
        .compra-total { display: flex; justify-content: space-between; align-items: center; margin-bottom: 22px; padding: 0 4px; }
        .compra-total-label { font-family: 'DM Sans', sans-serif; font-size: 0.85rem; color: #888; text-transform: uppercase; letter-spacing: 0.1em; }
        .compra-total-valor { font-family: 'Bebas Neue', sans-serif; font-size: 1.9rem; color: #f5c800; letter-spacing: 0.03em; }
        .compra-error { background: #ff4444; color: #fff; padding: 10px 14px; border-radius: 6px; margin-bottom: 14px; font-family: 'DM Sans', sans-serif; font-size: 0.82rem; }
        .btn-webpay { width: 100%; padding: 14px; background: #f5c800; border: none; border-radius: 6px; color: #000; font-family: 'DM Sans', sans-serif; font-size: 0.9rem; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; cursor: pointer; transition: all 0.3s; }
        .btn-webpay:hover { background: #ffd700; box-shadow: 0 4px 16px rgba(245,200,0,0.3); }
        .btn-webpay:disabled { background: #3a3a1a; color: #777; cursor: not-allowed; box-shadow: none; }
        .webpay-nota { color: #777; font-size: 0.72rem; margin: 6px 0 16px; text-align: center; font-family: 'DM Sans', sans-serif; }
        .btn-wsp { width: 100%; padding: 14px; background: #25D366; border: none; border-radius: 6px; color: #fff; font-family: 'DM Sans', sans-serif; font-size: 0.85rem; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .btn-wsp:hover { background: #1ebe5a; box-shadow: 0 4px 16px rgba(37,211,102,0.3); }
        .btn-cerrar-compra { width: 100%; padding: 12px; margin-top: 12px; background: transparent; border: 1px solid #333; color: #888; border-radius: 6px; font-family: 'DM Sans', sans-serif; font-size: 0.85rem; cursor: pointer; transition: all 0.3s; }
        .btn-cerrar-compra:hover { border-color: #555; color: #aaa; }
      `}</style>

      <div className="compra-box" onClick={(e) => e.stopPropagation()}>
        <h2 className="compra-titulo">Comprar</h2>
        <p className="compra-nombre">{producto.nombre}</p>

        <div className="compra-cant-row">
          <span className="compra-cant-label">Cantidad</span>
          <div className="compra-cant-controles">
            <button className="cc-btn" onClick={bajar}>
              −
            </button>
            <span className="cc-num">{cantidad}</span>
            <button className="cc-btn" onClick={subir}>
              +
            </button>
          </div>
        </div>

        <div className="compra-total">
          <span className="compra-total-label">Total</span>
          <span className="compra-total-valor">
            ${totalLinea.toLocaleString("es-CL")}
          </span>
        </div>

        {error && <div className="compra-error">⚠️ {error}</div>}

        <button
          className="btn-webpay"
          onClick={handleWebpay}
          disabled={pagando}
        >
          {pagando ? "Redirigiendo..." : "Pagar con Webpay"}
        </button>
        <p className="webpay-nota">
          Para pagar con Webpay debes iniciar sesión con Google.
        </p>

        <button className="btn-wsp" onClick={handleWhatsapp}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M5.077 0C2.268 0 0 2.268 0 5.077v13.846C0 21.732 2.268 24 5.077 24h13.846C21.732 24 24 21.732 24 18.923V5.077C24 2.268 21.732 0 18.923 0H5.077zm8.399 18.075c-1.197 0-2.368-.32-3.395-.928L5.5 18.5l1.37-4.497a6.87 6.87 0 01-.977-3.542C5.893 7.001 8.894 4 12.476 4c3.582 0 6.583 3.001 6.583 6.461 0 3.46-3.001 6.614-6.583 6.614z" />
          </svg>
          Contactar con vendedor
        </button>

        <button className="btn-cerrar-compra" onClick={onClose}>
          Cerrar
        </button>
      </div>

      {mostrarLogin && (
        <LoginModal
          onClose={() => setMostrarLogin(false)}
          onLoginSuccess={() => setMostrarLogin(false)}
        />
      )}
    </div>
  );
}

export default CompraModal;
