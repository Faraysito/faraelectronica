import { useEffect, useState } from "react";
import { clp } from "../../lib/precios";

// aparece cuando el botón de compra principal ya quedó fuera de pantalla (hacia arriba).
// scroll + rAF en vez de IntersectionObserver: si el scroll salta por encima del botón
// (ancla, volver atrás, scroll rápido) el observer no avisa y la barra no salía.
function BarraCompraFija({ objetivoRef, producto, total, ctaTexto, onComprar, onAgregar, pagando }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = objetivoRef.current;
    if (!el) return;
    let frame = 0;
    const revisar = () => {
      frame = 0;
      setVisible(el.getBoundingClientRect().bottom < 0);
    };
    const programar = () => {
      if (!frame) frame = requestAnimationFrame(revisar);
    };
    programar();
    window.addEventListener("scroll", programar, { passive: true });
    window.addEventListener("resize", programar);
    return () => {
      window.removeEventListener("scroll", programar);
      window.removeEventListener("resize", programar);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [objetivoRef]);

  // el botón flotante de tema sube mientras la barra está abierta
  useEffect(() => {
    document.body.classList.toggle("barra-fija-activa", visible);
    return () => document.body.classList.remove("barra-fija-activa");
  }, [visible]);

  return (
    <div className={`barra-fija${visible ? " visible" : ""}`} inert={!visible}>
      <img src={producto.imagen_principal} alt="" className="bf-img" />
      <div className="bf-info">
        <span className="bf-nombre">{producto.nombre}</span>
        <span className="bf-precio">{clp(total)}</span>
      </div>
      <button type="button" className="bf-agregar" onClick={onAgregar}>
        + Carrito
      </button>
      {ctaTexto && (
        <button type="button" className="bf-comprar" onClick={onComprar} disabled={pagando}>
          <i className="bi bi-lightning-charge-fill" aria-hidden="true" />{" "}
          {pagando ? "Redirigiendo..." : ctaTexto}
        </button>
      )}
    </div>
  );
}

export default BarraCompraFija;
