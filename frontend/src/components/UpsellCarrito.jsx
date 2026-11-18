import { useEffect, useState } from "react";
import { API_URL } from "../lib/api";
import { TIENDA } from "../config/tienda";
import { clp } from "../lib/precios";

let catalogo = null; // cache por sesión

function cargarCatalogo() {
  if (catalogo) return Promise.resolve(catalogo);
  return fetch(`${API_URL}/api/productos/`)
    .then((r) => (r.ok ? r.json() : []))
    .then((data) => {
      catalogo = Array.isArray(data) ? data : [];
      return catalogo;
    })
    .catch(() => []);
}

// primero los complementos que se eligieron en el admin; si faltan, de la misma categoría
function sugerencias(productos, carrito, max = 2) {
  const enCarrito = new Set(carrito.map((p) => p.id));
  const disponibles = productos.filter((p) => !enCarrito.has(p.id) && !p.agotado);
  const complementos = new Set(carrito.flatMap((p) => p.complementos || []));
  const elegidos = disponibles.filter((p) => complementos.has(p.id));
  if (elegidos.length < max) {
    const categorias = new Set(carrito.map((p) => p.categoria));
    elegidos.push(
      ...disponibles
        .filter((p) => !complementos.has(p.id) && categorias.has(p.categoria))
        .sort((a, b) => (a.precio || 0) - (b.precio || 0)),
    );
  }
  return elegidos.slice(0, max);
}

function UpsellCarrito({ carrito, onAgregar }) {
  const [productos, setProductos] = useState(() => catalogo || []);

  useEffect(() => {
    if (catalogo) return;
    let activo = true;
    cargarCatalogo().then((data) => {
      if (activo) setProductos(data);
    });
    return () => {
      activo = false;
    };
  }, []);

  const lista = sugerencias(productos, carrito);
  if (!lista.length) return null;

  return (
    <div style={{ borderTop: "1px solid #222", paddingTop: 14, marginTop: 4 }}>
      <p
        style={{
          margin: "0 0 10px",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "0.72rem",
          fontWeight: 600,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#888",
        }}
      >
        {TIENDA.upsell.titulo}
      </p>
      {lista.map((p) => (
        <div
          key={p.id}
          className="carrito-item"
          style={{ marginBottom: 8, borderStyle: "dashed" }}
        >
          <img src={p.imagen_principal} alt={p.nombre} className="carrito-item-img" />
          <div className="carrito-item-info">
            <p className="carrito-item-nombre">{p.nombre}</p>
            <p className="carrito-item-precio">{clp(p.precio)}</p>
          </div>
          <button
            type="button"
            className="ctrl-btn"
            style={{ width: "auto", padding: "0 12px", fontSize: "0.75rem", fontWeight: 600 }}
            onClick={() => onAgregar(p)}
          >
            + Agregar
          </button>
        </div>
      ))}
    </div>
  );
}

export default UpsellCarrito;
