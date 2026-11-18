import { useEffect, useState } from "react";
import ProductoModal from "./ProductoModal";
import CarritoModal from "./CarritoModal";
import CompraModal from "./CompraModal";
import LoginModal from "./LoginModal";
import Estrellas from "./producto/Estrellas";
import { useCarrito } from "../context/CarritoContext";
import { datosProducto, track } from "../lib/metaPixel";
import { useFiltroProductos } from "../hooks/useFiltroProductos";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://faraelectronica-backend.onrender.com";

function CatalogoBase({ categoria, titulo, subtitulo }) {
  const [productos, setProductos] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tardando, setTardando] = useState(false); // aviso cold-start
  const [agregados, setAgregados] = useState({});
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [comprarProducto, setComprarProducto] = useState(null);
  const { agregarAlCarrito } = useCarrito();

  const hayUsuario = () => !!localStorage.getItem("user");

  const {
    busqueda,
    setBusqueda,
    precioMax,
    setPrecioMax,
    precioTope,
    orden,
    setOrden,
    productosFiltrados,
  } = useFiltroProductos(productos);

  useEffect(() => {
    let activo = true;
    // Si tarda más de 3s, probablemente Render está despertando -> avisar.
    const avisoTimer = setTimeout(() => activo && setTardando(true), 3000);

    fetch(`${API_URL}/api/productos/?categoria=${categoria}`)
      .then((res) => res.json())
      .then((data) => {
        if (!activo) return;
        setProductos(data);
        setLoading(false);
        setTardando(false);
      })
      .catch(() => {
        if (!activo) return;
        setLoading(false);
        setTardando(false);
      });

    return () => {
      activo = false;
      clearTimeout(avisoTimer);
    };
  }, [categoria]);

  const volarAlCarrito = (e, producto) => {
    const card = e.currentTarget.closest(".prod-card");
    const img = card ? card.querySelector(".prod-img") : null;
    if (!img) return;
    const rect = img.getBoundingClientRect();
    const fly = document.createElement("img");
    fly.src = producto.imagen_principal;
    fly.className = "fly-img";
    fly.style.left = rect.left + "px";
    fly.style.top = rect.top + "px";
    fly.style.setProperty(
      "--fly-x",
      window.innerWidth - rect.left - 120 + "px",
    );
    fly.style.setProperty("--fly-y", -rect.top + 30 + "px");
    document.body.appendChild(fly);
    setTimeout(() => fly.remove(), 800);
  };

  const handleAgregar = (e, producto) => {
    e.stopPropagation();
    if (!hayUsuario()) {
      setMostrarLogin(true);
      return;
    }
    volarAlCarrito(e, producto);
    agregarAlCarrito(producto);
    track("AddToCart", datosProducto(producto));
    setAgregados((p) => ({ ...p, [producto.id]: true }));
    setTimeout(
      () => setAgregados((p) => ({ ...p, [producto.id]: false })),
      1500,
    );
  };

  const handleComprar = (e, producto) => {
    e.stopPropagation();
    setComprarProducto(producto);
  };

  const hayResultados = productosFiltrados.length > 0;
  const hayProductos = productos.length > 0;

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
        .pag-titulo { font-family:'Bebas Neue',sans-serif; font-size:clamp(2rem,5vw,4rem); color:#f5f5f5; letter-spacing:0.08em; text-align:center; margin-bottom:8px; }
        .pag-titulo span { color:#f5c800; }
        .pag-sub { font-family:'DM Sans',sans-serif; font-size:0.85rem; color:#555; letter-spacing:0.15em; text-transform:uppercase; text-align:center; margin-bottom:28px; }
        .cold-warn { max-width:1200px; margin:0 auto 24px; background:#f5c80009; border:1px solid #f5c80040; border-radius:6px; padding:12px 18px; display:flex; align-items:center; gap:10px; }
        .cold-warn .spin { width:16px; height:16px; border:2px solid #f5c80040; border-top-color:#f5c800; border-radius:50%; animation:cspin 0.8s linear infinite; flex-shrink:0; }
        @keyframes cspin { to { transform:rotate(360deg); } }
        .warn-txt { font-family:'DM Sans',sans-serif; font-size:0.78rem; color:#b89500; line-height:1.6; font-weight:300; }
        .controles { max-width:1200px; margin:0 auto 28px; display:flex; gap:14px; flex-wrap:wrap; align-items:center; justify-content:space-between; }
        .buscador-wrap { position:relative; flex:1; min-width:240px; }
        .buscador { width:100%; background:#111; color:#f5f5f5; border:1px solid #222; padding:12px 16px 12px 42px; border-radius:50px; font-family:'DM Sans',sans-serif; font-size:0.9rem; outline:none; transition:all 0.3s ease; box-sizing:border-box; }
        .buscador::placeholder { color:#555; }
        .buscador:focus { border-color:#f5c80060; box-shadow:0 0 12px rgba(245,200,0,0.1); }
        .buscador-icon { position:absolute; left:15px; top:50%; transform:translateY(-50%); color:#666; pointer-events:none; }
        .filtros-derecha { display:flex; gap:12px; align-items:center; flex-wrap:wrap; }
        .precio-filtro { display:flex; align-items:center; gap:10px; font-family:'DM Sans',sans-serif; font-size:0.78rem; color:#888; }
        .precio-filtro input[type=range] { accent-color:#f5c800; cursor:pointer; }
        .precio-valor { color:#f5c800; font-weight:600; min-width:80px; text-align:right; }
        .sort-select { background:#111; color:#f5c800; border:1px solid #222; padding:10px 32px 10px 16px; border-radius:4px; font-family:'DM Sans',sans-serif; font-size:0.85rem; cursor:pointer; outline:none; transition:all 0.3s ease; appearance:none; background-image:url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292%22%20height%3D%22292%22%3E%3Cpath%20fill%3D%22%23f5c800%22%20d%3D%22M287%2069a18%2018%200%200%200-13-5H18a18%2018%200%200%200-13%2031l128%20128a18%2018%200%200%200%2026%200L287%2095a18%2018%200%200%200%200-26z%22%2F%3E%3C%2Fsvg%3E"); background-repeat:no-repeat; background-position:right 12px center; background-size:10px; }
        .sort-select:hover, .sort-select:focus { border-color:#f5c80060; }
        .sort-select option { background:#111; color:#f5f5f5; }
        .prod-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:28px; max-width:1200px; margin:0 auto; }
        .prod-card { background:linear-gradient(135deg,#111 0%,#1a1a1a 100%); border:1px solid #222; border-radius:8px; overflow:hidden; transition:all 0.4s cubic-bezier(0.23,1,0.320,1); cursor:pointer; position:relative; box-shadow:0 4px 20px rgba(0,0,0,0.4); display:flex; flex-direction:column; }
        .prod-card::before { content:''; position:absolute; inset:0; background:linear-gradient(135deg,#f5c80015 0%,transparent 100%); opacity:0; transition:opacity 0.4s ease; pointer-events:none; z-index:1; }
        .prod-card:hover { transform:translateY(-8px); border-color:#f5c80060; box-shadow:0 12px 40px rgba(245,200,0,0.15); }
        .prod-card:hover::before { opacity:1; }
        .prod-card:hover .prod-img { filter:brightness(1.05) saturate(1.1); transform:scale(1.05); }
        .prod-img-container { width:100%; height:240px; overflow:hidden; background:#000; position:relative; }
        .prod-img { width:100%; height:100%; object-fit:cover; filter:brightness(0.9); display:block; transition:all 0.4s ease; }
        .prod-agotado-badge { position:absolute; top:12px; right:12px; z-index:2; background:#ff4444; color:#fff; font-family:'DM Sans',sans-serif; font-size:0.65rem; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; padding:5px 12px; border-radius:20px; }
        .prod-stock-bajo { position:absolute; top:12px; left:12px; z-index:2; background:#f5c800; color:#000; font-family:'DM Sans',sans-serif; font-size:0.62rem; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; padding:4px 10px; border-radius:20px; }
        .prod-body { padding:24px; flex-grow:1; display:flex; flex-direction:column; }
        .prod-nombre { font-family:'Bebas Neue',sans-serif; font-size:1.35rem; color:#f5f5f5; letter-spacing:0.04em; margin:0 0 8px; line-height:1.3; }
        .prod-desc { font-family:'DM Sans',sans-serif; font-size:0.8rem; color:#888; font-weight:300; line-height:1.5; margin:0 0 18px; flex-grow:1; }
        .prod-footer { display:flex; align-items:center; justify-content:space-between; gap:8px; border-top:1px solid #222; padding-top:16px; margin-top:auto; flex-wrap:wrap; }
        .prod-precio { font-family:'DM Sans',sans-serif; font-size:1.5rem; font-weight:700; color:#f5c800; margin:0; }
        .prod-btns { display:flex; gap:6px; flex-wrap:wrap; }
        .btn-ver-mas { font-family:'DM Sans',sans-serif; font-size:0.7rem; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; background:transparent; border:1.5px solid #f5c800; color:#f5c800; padding:8px 12px; border-radius:4px; cursor:pointer; transition:all 0.3s ease; white-space:nowrap; }
        .btn-ver-mas:hover { background:#f5c800; color:#000; box-shadow:0 4px 12px rgba(245,200,0,0.3); }
        .btn-agregar { font-family:'DM Sans',sans-serif; font-size:0.7rem; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; padding:8px 12px; border-radius:4px; cursor:pointer; transition:all 0.3s ease; white-space:nowrap; background:transparent; border:1.5px solid #4caf50; color:#4caf50; }
        .btn-agregar:hover { background:#4caf50; color:#fff; }
        .btn-agregar.agregado { background:#25D366; color:#fff; border-color:#25D366; }
        .btn-comprar-card { font-family:'DM Sans',sans-serif; font-size:0.7rem; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; border:none; padding:8px 14px; border-radius:4px; cursor:pointer; transition:all 0.3s ease; white-space:nowrap; background:#f5c800; color:#000; }
        .btn-comprar-card:hover { background:#ffd700; box-shadow:0 4px 12px rgba(245,200,0,0.4); }
        .btn-disabled { background:#2a2a2a !important; color:#666 !important; border-color:#2a2a2a !important; cursor:not-allowed !important; box-shadow:none !important; }
        .estado-grid { grid-column:1 / -1; text-align:center; padding:60px 20px; color:#666; font-family:'DM Sans',sans-serif; }
        .estado-grid .icono { font-size:2.4rem; margin-bottom:12px; opacity:0.5; }
        .estado-grid .limpiar { margin-top:16px; background:transparent; border:1px solid #f5c80060; color:#f5c800; padding:8px 20px; border-radius:50px; font-family:'DM Sans',sans-serif; font-size:0.78rem; cursor:pointer; transition:all 0.3s; }
        .estado-grid .limpiar:hover { background:#f5c800; color:#000; }
        .skeleton { background:linear-gradient(90deg,#161616 25%,#222 50%,#161616 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:6px; }
        @keyframes shimmer { 0%{background-position:200% 0;} 100%{background-position:-200% 0;} }
        .fly-img { position:fixed; width:80px; height:80px; object-fit:cover; border-radius:8px; z-index:5000; pointer-events:none; animation:fly 0.8s cubic-bezier(0.4,0,0.2,1) forwards; }
        @keyframes fly { to { transform:translate(var(--fly-x),var(--fly-y)) scale(0.2); opacity:0; } }
        @media (max-width:768px) { .prod-grid { grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:16px; } .controles { flex-direction:column; align-items:stretch; } .filtros-derecha { justify-content:space-between; } }
      `}</style>

      <h1 className="pag-titulo">{titulo}</h1>
      <p className="pag-sub">{subtitulo}</p>

      {tardando && (
        <div className="cold-warn">
          <div className="spin" />
          <span className="warn-txt">
            Estamos despertando el servidor. Esto puede tardar unos segundos la
            primera vez; los productos aparecerán solos.
          </span>
        </div>
      )}

      {!loading && hayProductos && (
        <div className="controles">
          <div className="buscador-wrap">
            <svg
              className="buscador-icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              className="buscador"
              type="text"
              placeholder="Buscar producto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <div className="filtros-derecha">
            {precioTope > 0 && (
              <div className="precio-filtro">
                <span>Hasta</span>
                <input
                  type="range"
                  min={0}
                  max={precioTope}
                  step={Math.max(1000, Math.round(precioTope / 50))}
                  value={precioMax == null ? precioTope : precioMax}
                  onChange={(e) => setPrecioMax(Number(e.target.value))}
                />
                <span className="precio-valor">
                  $
                  {(precioMax == null ? precioTope : precioMax).toLocaleString(
                    "es-CL",
                  )}
                </span>
              </div>
            )}
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
        </div>
      )}

      <div className="prod-grid">
        {loading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div className="prod-card" key={"sk" + i}>
              <div className="skeleton" style={{ height: "240px" }} />
              <div className="prod-body">
                <div
                  className="skeleton"
                  style={{ height: 20, width: "70%", marginBottom: 10 }}
                />
                <div
                  className="skeleton"
                  style={{ height: 14, width: "100%", marginBottom: 6 }}
                />
                <div
                  className="skeleton"
                  style={{ height: 14, width: "85%", marginBottom: 18 }}
                />
                <div
                  className="skeleton"
                  style={{ height: 32, width: "50%" }}
                />
              </div>
            </div>
          ))}

        {!loading && !hayProductos && (
          <div className="estado-grid">
            <div className="icono">📦</div>
            <p>No hay productos disponibles en esta categoría todavía.</p>
          </div>
        )}

        {!loading && hayProductos && !hayResultados && (
          <div className="estado-grid">
            <div className="icono">🔍</div>
            <p>Ningún producto coincide con tu búsqueda.</p>
            <button
              className="limpiar"
              onClick={() => {
                setBusqueda("");
                setPrecioMax(null);
              }}
            >
              Limpiar filtros
            </button>
          </div>
        )}

        {!loading &&
          productosFiltrados.map((p) => (
            <div
              className="prod-card"
              key={p.id}
              onClick={() => setSeleccionado(p)}
            >
              <div className="prod-img-container">
                {p.agotado && (
                  <span className="prod-agotado-badge">Agotado</span>
                )}
                {!p.agotado && p.stock > 0 && p.stock <= 5 && (
                  <span className="prod-stock-bajo">Quedan {p.stock}</span>
                )}
                <img
                  src={p.imagen_principal}
                  alt={p.nombre}
                  className="prod-img"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="prod-body">
                <h2 className="prod-nombre">{p.nombre}</h2>
                {p.rating_total > 0 && (
                  <div style={{ margin: "-2px 0 10px" }}>
                    <Estrellas
                      valor={p.rating_promedio}
                      total={p.rating_total}
                      tamano="sm"
                    />
                  </div>
                )}
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

export default CatalogoBase;
