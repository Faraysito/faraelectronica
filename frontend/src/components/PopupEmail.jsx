import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { TIENDA } from "../config/tienda";
import { klaviyoActivo, suscribirEmail } from "../lib/klaviyo";
import { track } from "../lib/metaPixel";

const CLAVE = "fara_popup_email";
const RUTAS_SIN_POPUP = ["/pago/retorno", "/admin"];
const DIA_MS = 24 * 60 * 60 * 1000;

function leerEstado() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE) || "null");
  } catch {
    return null;
  }
}

function guardarEstado(estado) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(estado));
  } catch {
    // sin storage: el popup puede volver a salir, no pasa nada
  }
}

function yaVisto(dias) {
  const estado = leerEstado();
  if (!estado) return false;
  if (estado.suscrito) return true;
  return Date.now() - (estado.cerrado || 0) < dias * DIA_MS;
}

// pop-up de email -> lista de Klaviyo (sin VITE_KLAVIYO_PUBLIC_KEY / LIST_ID no aparece)
function PopupEmail() {
  const { pathname } = useLocation();
  const cfg = TIENDA.popupEmail;
  const habilitado = TIENDA.secciones.popupEmail && klaviyoActivo();
  const rutaExcluida = RUTAS_SIN_POPUP.some((r) => pathname.startsWith(r));
  const [abierto, setAbierto] = useState(false);
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState("idle"); // idle | enviando | ok
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!habilitado || rutaExcluida || yaVisto(cfg.diasEntreAperturas)) return;
    // en el home espera a que cierren la nota del desarrollador
    const notaAbierta = () =>
      pathname === "/" && !sessionStorage.getItem("fara_aviso_visto");
    const abrir = () => {
      if (!notaAbierta() && !yaVisto(cfg.diasEntreAperturas)) setAbierto(true);
    };
    const timer = setTimeout(abrir, cfg.segundos * 1000);
    const alSalir = (e) => {
      if (!e.relatedTarget && e.clientY <= 0) abrir();
    };
    document.addEventListener("mouseout", alSalir);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseout", alSalir);
    };
  }, [habilitado, rutaExcluida, pathname, cfg.diasEntreAperturas, cfg.segundos]);

  useEffect(() => {
    if (!abierto) return;
    const conEsc = (e) => {
      if (e.key === "Escape") {
        guardarEstado({ cerrado: Date.now() });
        setAbierto(false);
      }
    };
    document.addEventListener("keydown", conEsc);
    return () => document.removeEventListener("keydown", conEsc);
  }, [abierto]);

  const cerrar = () => {
    if (estado !== "ok") guardarEstado({ cerrado: Date.now() });
    setAbierto(false);
  };

  const enviar = async (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Revisa tu correo.");
      return;
    }
    setEstado("enviando");
    setError(null);
    try {
      await suscribirEmail(email.trim());
      guardarEstado({ suscrito: true, cerrado: Date.now() });
      track("Lead", { content_name: "popup_email" });
      setEstado("ok");
    } catch (err) {
      setError(err.message);
      setEstado("idle");
    }
  };

  if (!abierto) return null;

  return (
    <div className="pe-overlay" onClick={cerrar}>
      <style>{`
        .pe-overlay { position: fixed; inset: 0; z-index: 3200; display: flex; align-items: center; justify-content: center; padding: 20px; background: rgba(0,0,0,0.82); }
        .pe-box { position: relative; width: 100%; max-width: 420px; padding: 34px 30px 26px; background: linear-gradient(135deg, #111 0%, #1a1a1a 100%); border: 1px solid #2a2a00; border-radius: 12px; text-align: center; box-shadow: 0 12px 40px rgba(245,200,0,0.12); font-family: 'DM Sans', sans-serif; }
        .pe-box::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, #f5c800, transparent); border-radius: 12px 12px 0 0; }
        .pe-x { position: absolute; top: 10px; right: 12px; background: none; border: none; color: #777; font-size: 1.1rem; cursor: pointer; }
        .pe-titulo { font-family: 'Bebas Neue', sans-serif; font-size: 2rem; letter-spacing: 0.06em; color: #f5f5f5; margin: 0 0 10px; }
        .pe-texto { color: #999; font-size: 0.88rem; line-height: 1.6; margin: 0 0 18px; }
        .pe-input { width: 100%; box-sizing: border-box; padding: 13px 14px; margin-bottom: 10px; background: #0d0d0d; color: #f5f5f5; border: 1px solid #333; border-radius: 6px; font: inherit; font-size: 0.9rem; outline: none; }
        .pe-input:focus { border-color: #f5c80088; }
        .pe-btn { width: 100%; padding: 13px; background: #f5c800; color: #000; border: none; border-radius: 6px; font: inherit; font-size: 0.85rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; }
        .pe-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .pe-error { color: #ff6b6b; font-size: 0.8rem; margin: 0 0 10px; }
        .pe-legal { display: block; margin-top: 12px; color: #666; font-size: 0.7rem; line-height: 1.5; }
      `}</style>
      <div
        className="pe-box"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pe-titulo"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="pe-x" onClick={cerrar} aria-label="Cerrar">
          ✕
        </button>
        {estado === "ok" ? (
          <>
            <h2 id="pe-titulo" className="pe-titulo">
              {cfg.gracias}
            </h2>
            <button type="button" className="pe-btn" onClick={cerrar}>
              Seguir mirando
            </button>
          </>
        ) : (
          <form onSubmit={enviar} noValidate>
            <h2 id="pe-titulo" className="pe-titulo">
              {cfg.titulo}
            </h2>
            <p className="pe-texto">{cfg.texto}</p>
            <input
              className="pe-input"
              type="email"
              autoComplete="email"
              placeholder="tu@correo.cl"
              aria-label="Tu correo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {error && <p className="pe-error">{error}</p>}
            <button type="submit" className="pe-btn" disabled={estado === "enviando"}>
              {estado === "enviando" ? "Enviando..." : cfg.boton}
            </button>
            <small className="pe-legal">{cfg.legal}</small>
          </form>
        )}
      </div>
    </div>
  );
}

export default PopupEmail;
