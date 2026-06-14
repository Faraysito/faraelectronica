import { useEffect, useState } from "react";
import ProductoModal from "../components/ProductoModal";
import CarritoModal from "../components/CarritoModal";
import CompraModal from "../components/CompraModal";
import LoginModal from "../components/LoginModal";
import { useCarrito } from "../context/CarritoContext";

function Camaras() {
  const [productos, setProductos] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orden, setOrden] = useState("defecto");
  const [agregados, setAgregados] = useState({});
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [comprarProducto, setComprarProducto] = useState(null);
  const { agregarAlCarrito } = useCarrito();

  const hayUsuario = () => !!localStorage.getItem("user");

  useEffect(() => {
    fetch(
      "https://faraelectronica-backend.onrender.com/api/productos/?categoria=camaras",
    )
      .then((res) => res.json())
      .then((data) => {
        setProductos(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const productosOrdenados = [...productos].sort((a, b) => {
    if (orden === "precio_asc") return (a.precio || 0) - (b.precio || 0);
    if (orden === "precio_desc") return (b.precio || 0) - (a.precio || 0);
    if (orden === "nombre_asc") return a.nombre.localeCompare(b.nombre);
    return 0;
  });

  const handleAgregar = (e, producto) => {
    e.stopPropagation();
    // Si no hay sesión, NO agrega: abre el login con Google.
    if (!hayUsuario()) {
      setMostrarLogin(true);
      return;
    }
    agregarAlCarrito(producto);
    setAgregados((prev) => ({ ...prev, [producto.id]: true }));
    setTimeout(
      () => setAgregados((prev) => ({ ...prev, [producto.id]: false })),
      1500,
    );
  };

  // Comprar: abre el modal de compra (Webpay + WhatsApp + cantidad)
  const handleComprar = (e, producto) => {
    e.stopPropagation();
    setComprarProducto(producto);
  };

  return (
    <div
      style={{
        background: "#0a0a0a",
        minHeight: "calc(100vh - 60px)",
        padding: "48px 24px",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');
        .pag-titulo { font-family: 'Bebas Neue', sans-serif; font-size: clamp(2rem, 5vw, 4rem); color: #f5f5f5; letter-spacing: 0.08em; text-align: center; margin-bottom: 8px; }
        .pag-titulo span { color: #f5c800; }
        .pag-sub { font-family: 'DM Sans', sans-serif; font-size: 0.85rem; color: #555; letter-spacing: 0.15em; text-transform: uppercase; text-align: center; margin-bottom: 28px; }
        .render-warn { max-width: 1200px; margin: 0 auto 24px; background: #f5c80009; border: 1px solid #f5c80040; border-radius: 6px; padding: 12px 18px; display: flex; align-items: flex-start; gap: 10px; }
        .warn-txt { font-family: 'DM Sans', sans-serif; font-size: 0.78rem; color: #b89500; line-height: 1.6; font-weight: 300; }
        .sort-container { max-width: 1200px; margin: 0 auto 24px; display: flex; justify-content: flex-end; align-items: center; gap: 12px; }
        .sort-label { color: #888; font-family: 'DM Sans', sans-serif; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 500; }
        .sort-select { background: #111; color: #f5c800; border: 1px solid #222; padding: 8px 16px; border-radius: 4px; font-family: 'DM Sans', sans-serif; font-size: 0.85rem; cursor: pointer; outline: none; transition: all 0.3s ease; appearance: none; background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23f5c800%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E"); background-repeat: no-repeat; background-position: right 12px top 50%; background-size: 10px auto; padding-right: 32px; }
        .sort-select:hover, .sort-select:focus { border-color: #f5c80060; box-shadow: 0 0 10px rgba(245,200,0,0.1); }
        .sort-select option { background: #111; color: #f5f5f5; }
        .prod-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 28px; max-width: 1200px; margin: 0 auto; }
        .prod-card { background: linear-gradient(135deg, #111 0%, #1a1a1a 100%); border: 1px solid #222; border-radius: 8px; overflow: hidden; transition: all 0.4s cubic-bezier(0.23, 1, 0.320, 1); cursor: pointer; position: relative; box-shadow: 0 4px 20px rgba(0,0,0,0.4); display: flex; flex-direction: column; }
        .prod-card::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, #f5c80015 0%, transparent 100%); opacity: 0; transition: opacity 0.4s ease; pointer-events: none; z-index: 1; }
        .prod-card:hover { transform: translateY(-8px); border-color: #f5c80060; box-shadow: 0 12px 40px rgba(245,200,0,0.15); }
        .prod-card:hover::before { opacity: 1; }
        .prod-card:hover .prod-img { filter: brightness(1.05) saturate(1.1); transform: scale(1.05); }
        .prod-img-container { width: 100%; height: 240px; overflow: hidden; background: #000; position: relative; }
        .prod-img { width: 100%; height: 100%; object-fit: cover; filter: brightness(0.9); display: block; transition: all 0.4s ease; }
        .prod-agotado-badge { position: absolute; top: 12px; right: 12px; z-index: 2; background: #ff4444; color: #fff; font-family: 'DM Sans', sans-serif; font-size: 0.65rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; padding: 5px 12px; border-radius: 20px; }
        .prod-body { padding: 24px; flex-grow: 1; display: flex; flex-direction: column; }
        .prod-nombre { font-family: 'Bebas Neue', sans-serif; font-size: 1.35rem; color: #f5f5f5; letter-spacing: 0.04em; margin: 0 0 8px; line-height: 1.3; }
        .prod-desc { font-family: 'DM Sans', sans-serif; font-size: 0.8rem; color: #888; font-weight: 300; line-height: 1.5; margin: 0 0 18px; flex-grow: 1; }
        .prod-footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; border-top: 1px solid #222; padding-top: 16px; margin-top: auto; flex-wrap: wrap; }
        .prod-precio { font-family: 'DM Sans', sans-serif; font-size: 1.5rem; font-weight: 700; color: #f5c800; margin: 0; }
        .prod-btns { display: flex; gap: 6px; flex-wrap: wrap; }
        .btn-ver-mas { font-family: 'DM Sans', sans-serif; font-size: 0.7rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; background: transparent; border: 1.5px solid #f5c800; color: #f5c800; padding: 8px 12px; border-radius: 4px; cursor: pointer; transition: all 0.3s ease; white-space: nowrap; }
        .btn-ver-mas:hover { background: #f5c800; color: #000; box-shadow: 0 4px 12px rgba(245,200,0,0.3); }
        .btn-agregar { font-family: 'DM Sans', sans-serif; font-size: 0.7rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; transition: all 0.3s ease; white-space: nowrap; background: transparent; border: 1.5px solid #4caf50; color: #4caf50; }
        .btn-agregar:hover { background: #4caf50; color: #fff; }
        .btn-agregar.agregado { background: #25D366; color: #fff; border-color: #25D366; }
        .btn-comprar-card { font-family: 'DM Sans', sans-serif; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; border: none; padding: 8px 14px; border-radius: 4px; cursor: pointer; transition: all 0.3s ease; white-space: nowrap; background: #f5c800; color: #000; }
        .btn-comprar-card:hover { background: #ffd700; box-shadow: 0 4px 12px rgba(245,200,0,0.4); }
        .btn-disabled { background: #2a2a2a !important; color: #666 !important; border-color: #2a2a2a !important; cursor: not-allowed !important; box-shadow: none !important; }
        .empty-state { grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #666; }
        .empty-state p { font-family: 'DM Sans', sans-serif; font-size: 1rem; }
        .loading-state { grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #666; font-family: 'DM Sans', sans-serif; }
        @media (max-width: 768px) { .prod-grid { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; } .sort-container { justify-content: center; } }
      `}</style>

      <h1 className="pag-titulo">
        Cámaras de <span>Seguridad</span>
      </h1>
      <p className="pag-sub">Vigilancia profesional para tu hogar y negocio</p>

      <div className="render-warn">
        <span className="warn-txt">
          El servidor entra en reposo cuando no hay actividad. Si no ves
          productos, espera unos segundos y recarga.
        </span>
      </div>

      {!loading && productos.length > 0 && (
        <div className="sort-container">
          <span className="sort-label">Ordenar por:</span>
          <select
            className="sort-select"
            value={orden}
            onChange={(e) => setOrden(e.target.value)}
          >
            <option value="defecto">Recomendados</option>
            <option value="precio_asc">Precio: Menor a Mayor</option>
            <option value="precio_desc">Precio: Mayor a Menor</option>
            <option value="nombre_asc">Nombre: A - Z</option>
          </select>
        </div>
      )}

      <div className="prod-grid">
        {loading && (
          <div className="loading-state">
            CARGANDO (PUEDE TARDAR UNOS MINUTOS)...
          </div>
        )}
        {!loading && productos.length === 0 && (
          <div className="empty-state">
            <p>No hay productos disponibles en esta categoría.</p>
          </div>
        )}

        {productosOrdenados.map((p) => (
          <div
            className="prod-card"
            key={p.id}
            onClick={() => setSeleccionado(p)}
          >
            <div className="prod-img-container">
              {p.agotado && <span className="prod-agotado-badge">Agotado</span>}
              <img
                src={p.imagen_principal}
                alt={p.nombre}
                className="prod-img"
              />
            </div>
            <div className="prod-body">
              <h2 className="prod-nombre">{p.nombre}</h2>
              <p className="prod-desc">{p.descripcion}</p>
              <div className="prod-footer">
                <p className="prod-precio">
                  ${p.precio?.toLocaleString("es-CL") || "0"}
                </p>
                <div className="prod-btns">
                  <button
                    className="btn-ver-mas"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSeleccionado(p);
                    }}
                  >
                    Detalles
                  </button>
                  <button
                    className={`btn-agregar${agregados[p.id] ? " agregado" : ""}${p.agotado ? " btn-disabled" : ""}`}
                    onClick={(e) => !p.agotado && handleAgregar(e, p)}
                    disabled={p.agotado}
                  >
                    {agregados[p.id] ? "✓" : "+ Carrito"}
                  </button>
                  <button
                    className={`btn-comprar-card${p.agotado ? " btn-disabled" : ""}`}
                    onClick={(e) => !p.agotado && handleComprar(e, p)}
                    disabled={p.agotado}
                  >
                    Comprar
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {seleccionado && (
        <ProductoModal
          producto={seleccionado}
          onClose={() => setSeleccionado(null)}
        />
      )}
      {mostrarCarrito && (
        <CarritoModal onClose={() => setMostrarCarrito(false)} />
      )}
      {comprarProducto && (
        <CompraModal
          producto={comprarProducto}
          onClose={() => setComprarProducto(null)}
        />
      )}
      {mostrarLogin && (
        <LoginModal
          onClose={() => setMostrarLogin(false)}
          onLoginSuccess={() => {
            setMostrarLogin(false);
            setMostrarCarrito(true);
          }}
        />
      )}
    </div>
  );
}

export default Camaras;
