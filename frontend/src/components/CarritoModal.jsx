import { useState } from "react";
import { useCarrito } from "../context/CarritoContext";
import { TIENDA } from "../config/tienda";
import { useTiendaConfig } from "../hooks/useTiendaConfig";
import { pagarConWebpay } from "../lib/checkout";
import { claveLinea } from "../lib/carrito";
import { totalLinea } from "../lib/precios";
import { datosProducto, track } from "../lib/metaPixel";
import EnvioGratisBarra from "./EnvioGratisBarra";
import UpsellCarrito from "./UpsellCarrito";

const WSP_NUMERO = "56940261248";

function CarritoModal({ onClose }) {
  const { carrito, agregarAlCarrito, quitarDelCarrito, cambiarCantidad, total } =
    useCarrito();
  const config = useTiendaConfig();
  const [pagando, setPagando] = useState(false);
  const [error, setError] = useState(null);

  const handlePagarWebpay = async () => {
    if (carrito.length === 0) return;
    setPagando(true);
    setError(null);
    try {
      // el backend recalcula combos/suscripción y crea la orden
      await pagarConWebpay(carrito);
    } catch (err) {
      setError(err.message);
      setPagando(false);
    }
  };

  const agregarUpsell = (producto) => {
    agregarAlCarrito(producto);
    track("AddToCart", datosProducto(producto));
  };

  // Comprar directo con el vendedor por WhatsApp
  const handleComprarVendedor = () => {
    if (carrito.length === 0) return;
    const lista = carrito
      .map(
        (p) =>
          `• ${p.nombre} x${p.cantidad} ($${totalLinea(p).toLocaleString("es-CL")})${p.suscripcion ? ` - suscripción cada ${p.frecuencia_dias} días` : ""}`,
      )
      .join("\n");
    const mensaje = encodeURIComponent(
      `Hola buenas, quisiera comprar:\n\n${lista}\n\nTotal: $${total.toLocaleString("es-CL")}`,
    );
    window.open(`https://wa.me/${WSP_NUMERO}?text=${mensaje}`, "_blank");
  };

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
        .carrito-box { background: linear-gradient(135deg, #111 0%, #1a1a1a 100%); border: 1px solid #2a2a00; border-radius: 12px; padding: 36px; max-width: 520px; width: 100%; position: relative; box-shadow: 0 12px 40px rgba(245,200,0,0.1); max-height: 85vh; display: flex; flex-direction: column; }
        .carrito-box::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, #f5c800, transparent); border-radius: 12px 12px 0 0; }
        .carrito-titulo { font-family: 'Bebas Neue', sans-serif; font-size: 2rem; color: #f5f5f5; letter-spacing: 0.08em; margin: 0 0 24px; }
        .carrito-titulo span { color: #f5c800; }
        .carrito-lista { overflow-y: auto; flex: 1; margin-bottom: 24px; display: flex; flex-direction: column; gap: 12px; }
        .carrito-item { display: flex; align-items: center; gap: 12px; background: #0d0d0d; border: 1px solid #222; border-radius: 8px; padding: 12px; }
        .carrito-item-img { width: 60px; height: 60px; object-fit: cover; border-radius: 6px; flex-shrink: 0; }
        .carrito-item-info { flex: 1; min-width: 0; }
        .carrito-item-nombre { font-family: 'Bebas Neue', sans-serif; font-size: 1rem; color: #f5f5f5; margin: 0 0 4px; letter-spacing: 0.04em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .carrito-item-precio { font-family: 'DM Sans', sans-serif; font-size: 0.85rem; color: #f5c800; font-weight: 600; margin: 0; }
        .carrito-item-controles { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .ctrl-btn { width: 28px; height: 28px; background: #1a1a1a; border: 1px solid #333; color: #f5c800; border-radius: 4px; cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center; transition: all 0.2s; font-family: 'DM Sans', sans-serif; }
        .ctrl-btn:hover { background: #f5c800; color: #000; border-color: #f5c800; }
        .ctrl-cantidad { font-family: 'DM Sans', sans-serif; font-size: 0.9rem; color: #f5f5f5; min-width: 20px; text-align: center; }
        .ctrl-eliminar { width: 28px; height: 28px; background: transparent; border: 1px solid #333; color: #666; border-radius: 4px; cursor: pointer; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .ctrl-eliminar:hover { background: #ff4444; color: #fff; border-color: #ff4444; }
        .carrito-footer { border-top: 1px solid #222; padding-top: 20px; }
        .carrito-total { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .carrito-total-label { font-family: 'DM Sans', sans-serif; font-size: 0.85rem; color: #888; text-transform: uppercase; letter-spacing: 0.1em; }
        .carrito-total-valor { font-family: 'Bebas Neue', sans-serif; font-size: 2rem; color: #f5c800; letter-spacing: 0.04em; }
        .carrito-error { background: #ff4444; color: #fff; padding: 10px 14px; border-radius: 6px; margin-bottom: 14px; font-family: 'DM Sans', sans-serif; font-size: 0.82rem; }
        .carrito-btns { display: flex; flex-direction: column; gap: 10px; }
        .carrito-btns-fila { display: flex; gap: 10px; }
        .btn-pagar { flex: 1; padding: 14px; background: #f5c800; border: none; border-radius: 6px; color: #000; font-family: 'DM Sans', sans-serif; font-size: 0.85rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .btn-pagar:hover { background: #ffd700; box-shadow: 0 4px 16px rgba(245,200,0,0.3); }
        .btn-pagar:disabled { background: #3a3a1a; color: #777; cursor: not-allowed; box-shadow: none; }
        .btn-wsp { width: 100%; padding: 13px; background: #25D366; border: none; border-radius: 6px; color: #fff; font-family: 'DM Sans', sans-serif; font-size: 0.82rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .btn-wsp:hover { background: #1ebe5a; box-shadow: 0 4px 16px rgba(37,211,102,0.3); }
        .btn-wsp:disabled { background: #1a3a24; color: #555; cursor: not-allowed; box-shadow: none; }
        .btn-cerrar-carrito { padding: 14px 20px; background: transparent; border: 1px solid #333; color: #888; border-radius: 6px; font-family: 'DM Sans', sans-serif; font-size: 0.85rem; cursor: pointer; transition: all 0.3s; }
        .btn-cerrar-carrito:hover { border-color: #555; color: #aaa; }
        .carrito-vacio { text-align: center; padding: 40px 0; color: #555; font-family: 'DM Sans', sans-serif; font-size: 0.9rem; }
        .carrito-vacio-icon { font-size: 3rem; margin-bottom: 12px; }
        .carrito-item-sus { display: inline-block; margin-top: 4px; font-family: 'DM Sans', sans-serif; font-size: 0.66rem; font-weight: 600; color: #4caf50; border: 1px solid #4caf5066; border-radius: 20px; padding: 2px 8px; }
      `}</style>

      <div className="carrito-box" onClick={(e) => e.stopPropagation()}>
        <h2 className="carrito-titulo">
          Tu <span>Carrito</span>
        </h2>

        <div className="carrito-lista">
          {carrito.length === 0 ? (
            <div className="carrito-vacio">
              <div className="carrito-vacio-icon">🛒</div>
              <p>Tu carrito está vacío</p>
            </div>
          ) : (
            carrito.map((p) => (
              <div className="carrito-item" key={claveLinea(p)}>
                <img
                  src={p.imagen_principal}
                  alt={p.nombre}
                  className="carrito-item-img"
                />
                <div className="carrito-item-info">
                  <p className="carrito-item-nombre">{p.nombre}</p>
                  <p className="carrito-item-precio">
                    ${totalLinea(p).toLocaleString("es-CL")}
                  </p>
                  {p.suscripcion && (
                    <span className="carrito-item-sus">
                      Suscripción c/{p.frecuencia_dias} días
                      {p.pct_suscripcion ? ` · -${p.pct_suscripcion}%` : ""}
                    </span>
                  )}
                </div>
                <div className="carrito-item-controles">
                  <button
                    className="ctrl-btn"
                    onClick={() => cambiarCantidad(claveLinea(p), p.cantidad - 1)}
                  >
                    −
                  </button>
                  <span className="ctrl-cantidad">{p.cantidad}</span>
                  <button
                    className="ctrl-btn"
                    onClick={() => cambiarCantidad(claveLinea(p), p.cantidad + 1)}
                  >
                    +
                  </button>
                  <button
                    className="ctrl-eliminar"
                    onClick={() => quitarDelCarrito(claveLinea(p))}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
          {carrito.length > 0 && TIENDA.secciones.upsell && (
            <UpsellCarrito carrito={carrito} onAgregar={agregarUpsell} />
          )}
        </div>

        <div className="carrito-footer">
          {carrito.length > 0 && TIENDA.secciones.envioGratis && (
            <EnvioGratisBarra subtotal={total} umbral={config.envio.gratis_desde} />
          )}
          {error && <div className="carrito-error">⚠️ {error}</div>}
          <div className="carrito-total">
            <span className="carrito-total-label">TOTAL</span>
            <span className="carrito-total-valor">
              ${total.toLocaleString("es-CL")}
            </span>
          </div>
          <div className="carrito-btns">
            <div className="carrito-btns-fila">
              <button className="btn-cerrar-carrito" onClick={onClose}>
                Cerrar
              </button>
              <button
                className="btn-pagar"
                onClick={handlePagarWebpay}
                disabled={carrito.length === 0 || pagando}
              >
                {pagando ? "Redirigiendo..." : "Pagar con Webpay"}
              </button>
            </div>
            <button
              className="btn-wsp"
              onClick={handleComprarVendedor}
              disabled={carrito.length === 0}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M5.077 0C2.268 0 0 2.268 0 5.077v13.846C0 21.732 2.268 24 5.077 24h13.846C21.732 24 24 21.732 24 18.923V5.077C24 2.268 21.732 0 18.923 0H5.077zm8.399 18.075c-1.197 0-2.368-.32-3.395-.928L5.5 18.5l1.37-4.497a6.87 6.87 0 01-.977-3.542C5.893 7.001 8.894 4 12.476 4c3.582 0 6.583 3.001 6.583 6.461 0 3.46-3.001 6.614-6.583 6.614z" />
              </svg>
              Comprar con el vendedor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CarritoModal;
