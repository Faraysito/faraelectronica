import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { API_URL } from "../lib/api";
import { TIENDA, titularPara } from "../config/tienda";
import { useTiendaConfig } from "../hooks/useTiendaConfig";
import { useVariante } from "../hooks/useVariante";
import { useCarrito } from "../context/CarritoContext";
import { clp, precioUnitario } from "../lib/precios";
import { hayUsuario, pagarConWebpay } from "../lib/checkout";
import { datosProducto, track } from "../lib/metaPixel";
import LoginModal from "../components/LoginModal";
import CarritoModal from "../components/CarritoModal";
import Galeria from "../components/producto/Galeria";
import Estrellas from "../components/producto/Estrellas";
import Combos from "../components/producto/Combos";
import Suscripcion from "../components/producto/Suscripcion";
import PrecioPorDia from "../components/producto/PrecioPorDia";
import Garantia from "../components/producto/Garantia";
import Sellos from "../components/producto/Sellos";
import Especificaciones from "../components/producto/Especificaciones";
import Resenas from "../components/producto/Resenas";
import TablaComparativa from "../components/producto/TablaComparativa";
import Timeline from "../components/producto/Timeline";
import Faq from "../components/producto/Faq";
import Disclaimer from "../components/producto/Disclaimer";
import BarraCompraFija from "../components/producto/BarraCompraFija";

const S = TIENDA.secciones;

function entero(valor, min, max) {
  const n = parseInt(valor, 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : null;
}

function infoStock(stock) {
  if (stock == null) return null;
  if (stock <= 0) return { texto: "Sin stock", color: "#ff4444" };
  if (stock <= 5) {
    return { texto: `Últimas ${stock} ${stock === 1 ? "unidad" : "unidades"}`, color: "#f5c800" };
  }
  return { texto: "Disponible", color: "#4caf50" };
}

const irAResenas = () =>
  document.getElementById("resenas")?.scrollIntoView({ behavior: "smooth", block: "start" });

function Cargando() {
  return (
    <div className="pdp">
      <style>{CSS}</style>
      <div className="pdp-top">
        <div className="skeleton" style={{ aspectRatio: "1 / 1", borderRadius: 12 }} />
        <div>
          <div className="skeleton" style={{ height: 40, width: "80%", marginBottom: 14 }} />
          <div className="skeleton" style={{ height: 24, width: "50%", marginBottom: 24 }} />
          <div className="skeleton" style={{ height: 36, width: "35%", marginBottom: 24 }} />
          <div className="skeleton" style={{ height: 110, marginBottom: 16 }} />
          <div className="skeleton" style={{ height: 52 }} />
        </div>
      </div>
    </div>
  );
}

function NoDisponible() {
  return (
    <div className="pdp">
      <style>{CSS}</style>
      <div className="pdp-estado">
        <div style={{ fontSize: "2.4rem", marginBottom: 12 }}>📦</div>
        <p>No encontramos este producto o el servidor está despertando.</p>
        <Link to="/" className="btn-sec">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}

function Producto() {
  const { id } = useParams();
  return <ProductoDetalle key={id} id={id} />;
}

function ProductoDetalle({ id }) {
  const [producto, setProducto] = useState(null);
  const [estado, setEstado] = useState("cargando");
  const [params] = useSearchParams();
  const config = useTiendaConfig();
  const varTitular = useVariante("titular");
  const varCta = useVariante("cta");
  const { agregarAlCarrito } = useCarrito();

  // ?cantidad=2&suscripcion=1&frecuencia=60 llega desde el correo de recompra
  const [cantidad, setCantidad] = useState(() => entero(params.get("cantidad"), 1, 3) || 1);
  const [suscripcion, setSuscripcion] = useState(() => params.get("suscripcion") === "1");
  const [frecuencia, setFrecuencia] = useState(() => entero(params.get("frecuencia"), 1, 365));
  const [pagando, setPagando] = useState(false);
  const [error, setError] = useState(null);
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  const [pendiente, setPendiente] = useState(null); // acción a retomar después del login
  const ctaRef = useRef(null);

  useEffect(() => {
    let activo = true;
    fetch(`${API_URL}/api/productos/${id}/`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((p) => {
        if (!activo) return;
        setProducto(p);
        setEstado("ok");
        track("ViewContent", datosProducto(p));
      })
      .catch(() => {
        if (activo) setEstado("error");
      });
    return () => {
      activo = false;
    };
  }, [id]);

  useEffect(() => {
    if (!producto) return;
    const anterior = document.title;
    document.title = `${producto.nombre} — Fara Electrónica`;
    return () => {
      document.title = anterior;
    };
  }, [producto]);

  if (estado === "cargando") return <Cargando />;
  if (estado === "error" || !producto) return <NoDisponible />;

  const pct = config.suscripcion.descuento_pct;
  const frecuencias = config.suscripcion.frecuencias_dias;
  const umbralEnvio = config.envio.gratis_desde;
  const puedeSuscribir =
    S.suscripcion && producto.permite_suscripcion && pct > 0 && frecuencias.length > 0;
  const conSuscripcion = puedeSuscribir && suscripcion;
  const frecuenciaSel = frecuencias.includes(frecuencia) ? frecuencia : frecuencias[0];
  const agotado = producto.agotado;
  const cant = S.combos ? Math.min(cantidad, Math.max(1, Math.min(3, producto.stock || 0))) : 1;

  const unitario = precioUnitario(producto, cant, {
    suscripcion: conSuscripcion,
    pctSuscripcion: pct,
  });
  const total = unitario * cant;
  const totalLista = producto.precio * cant;
  const unitarioUnica = precioUnitario(producto, cant);
  const unitarioSuscripcion = precioUnitario(producto, cant, { suscripcion: true, pctSuscripcion: pct });
  const titular = producto.titular || titularPara(producto.categoria, varTitular);
  const ctaTexto = TIENDA.cta[varCta] || TIENDA.cta.a;
  const stock = infoStock(producto.stock);
  const opcionesLinea = conSuscripcion ? { suscripcion: true, frecuencia_dias: frecuenciaSel } : {};

  const agregar = () => {
    if (!hayUsuario()) {
      setPendiente("agregar");
      setMostrarLogin(true);
      return;
    }
    agregarAlCarrito({ ...producto, pct_suscripcion: conSuscripcion ? pct : 0 }, cant, opcionesLinea);
    track("AddToCart", datosProducto(producto, cant, total));
    setMostrarCarrito(true);
  };

  // pago express: directo a Webpay sin pasar por el carrito
  const comprarAhora = async () => {
    if (!hayUsuario()) {
      setPendiente("pagar");
      setMostrarLogin(true);
      return;
    }
    setError(null);
    setPagando(true);
    try {
      await pagarConWebpay([{ id: producto.id, cantidad: cant, ...opcionesLinea }]);
    } catch (e) {
      setError(e.message);
      setPagando(false);
    }
  };

  const retomarTrasLogin = () => {
    const accion = pendiente;
    setPendiente(null);
    setMostrarLogin(false);
    if (accion === "agregar") agregar();
    if (accion === "pagar") comprarAhora();
  };

  return (
    <div className="pdp">
      <style>{CSS}</style>

      <div className="pdp-top">
        <Galeria producto={producto} />

        <div className="pdp-info">
          {S.titular && <p className="pdp-titular">{titular}</p>}
          <h1 className="pdp-nombre">{producto.nombre}</h1>

          {S.resenas && (
            <div className="pdp-rating">
              {producto.rating_total > 0 ? (
                <Estrellas
                  valor={producto.rating_promedio}
                  total={producto.rating_total}
                  onClick={irAResenas}
                />
              ) : (
                <button type="button" className="pdp-link-resenas" onClick={irAResenas}>
                  Aún sin reseñas
                </button>
              )}
            </div>
          )}

          {producto.descripcion && <p className="pdp-desc">{producto.descripcion}</p>}

          <div className="pdp-precio">
            <span className="pdp-precio-total">{clp(total)}</span>
            {total < totalLista && <s className="pdp-precio-antes">{clp(totalLista)}</s>}
            {cant > 1 && <span className="pdp-precio-unit">{clp(unitario)} c/u</span>}
          </div>
          {S.precioPorDia && !agotado && <PrecioPorDia precio={unitario} />}
          {stock && (
            <span className="pdp-stock" style={{ color: stock.color, borderColor: `${stock.color}66` }}>
              <span className="pdp-stock-dot" style={{ background: stock.color }} />
              {stock.texto}
            </span>
          )}

          {S.combos && !agotado && (
            <Combos
              producto={producto}
              cantidad={cant}
              onChange={setCantidad}
              suscripcion={conSuscripcion}
              pctSuscripcion={pct}
            />
          )}

          {puedeSuscribir && !agotado && (
            <Suscripcion
              activa={conSuscripcion}
              onChange={setSuscripcion}
              pct={pct}
              frecuencias={frecuencias}
              frecuencia={frecuenciaSel}
              onFrecuencia={setFrecuencia}
              precioUnica={unitarioUnica * cant}
              precioSuscripcion={unitarioSuscripcion * cant}
            />
          )}

          <div className="pdp-cta" ref={ctaRef}>
            {error && <div className="pdp-error">⚠️ {error}</div>}
            {S.pagoExpress && (
              <button
                type="button"
                className="pdp-btn-comprar"
                onClick={comprarAhora}
                disabled={agotado || pagando}
              >
                <i className="bi bi-lightning-charge-fill" aria-hidden="true" />
                {agotado ? "Agotado" : pagando ? "Redirigiendo..." : ctaTexto}
              </button>
            )}
            <button type="button" className="pdp-btn-agregar" onClick={agregar} disabled={agotado}>
              + Agregar al carrito
            </button>
            {S.pagoExpress && !agotado && (
              <p className="pdp-express-nota">
                Pago express: vas directo a Webpay, sin pasar por el carrito.
              </p>
            )}
          </div>

          {S.garantia && <Garantia />}
          {S.sellos && <Sellos certificaciones={producto.certificaciones} />}
        </div>
      </div>

      {producto.descripcion_larga && (
        <section className="pdp-seccion" aria-labelledby="titulo-desc">
          <h2 id="titulo-desc">
            Sobre este <span>producto</span>
          </h2>
          <p className="texto-largo">{producto.descripcion_larga}</p>
        </section>
      )}

      {S.especificaciones && <Especificaciones producto={producto} />}

      {(S.resenas || S.ugc) && (
        <div id="resenas">
          <Resenas productoId={producto.id} mostrarResenas={S.resenas} mostrarUgc={S.ugc} />
        </div>
      )}

      {S.comparativa && <TablaComparativa />}
      {S.timeline && <Timeline categoria={producto.categoria} />}
      {S.faq && (
        <Faq
          categoria={producto.categoria}
          condiciones={{ suscripcion: puedeSuscribir, envioGratis: S.envioGratis && umbralEnvio > 0 }}
          valores={{ pct, umbral: clp(umbralEnvio) }}
        />
      )}
      {S.disclaimer && <Disclaimer />}

      {S.barraFija && !agotado && (
        <BarraCompraFija
          objetivoRef={ctaRef}
          producto={producto}
          total={total}
          ctaTexto={S.pagoExpress ? ctaTexto : null}
          onComprar={comprarAhora}
          onAgregar={agregar}
          pagando={pagando}
        />
      )}

      {mostrarLogin && (
        <LoginModal
          onClose={() => {
            setMostrarLogin(false);
            setPendiente(null);
          }}
          onLoginSuccess={retomarTrasLogin}
        />
      )}
      {mostrarCarrito && <CarritoModal onClose={() => setMostrarCarrito(false)} />}
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap');
.pdp { background: var(--fondo); color: var(--texto); min-height: calc(100vh - 60px); padding: 24px 24px 120px; font-family: 'DM Sans', sans-serif; }
.pdp-top { max-width: 1150px; margin: 0 auto; display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr); gap: 40px; align-items: start; }
.pdp-galeria { position: sticky; top: 100px; }
.pdp-img-main { position: relative; background: #000; border: 1px solid var(--borde); border-radius: 12px; overflow: hidden; aspect-ratio: 1 / 1; }
.pdp-img-main img { width: 100%; height: 100%; object-fit: contain; display: block; }
.pdp-agotado { position: absolute; top: 14px; left: 14px; z-index: 1; background: #ff4444; color: #fff; font-size: .68rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; padding: 5px 12px; border-radius: 20px; }
.pdp-thumbs { display: flex; gap: 10px; margin-top: 12px; overflow-x: auto; }
.pdp-thumbs button { width: 68px; height: 68px; flex-shrink: 0; padding: 0; background: #000; border: 2px solid var(--borde); border-radius: 8px; overflow: hidden; cursor: pointer; }
.pdp-thumbs button.activo { border-color: var(--amarillo); }
.pdp-thumbs img { width: 100%; height: 100%; object-fit: cover; }
.pdp-titular { font-family: 'Bebas Neue', sans-serif; font-size: clamp(1.9rem, 4vw, 2.8rem); line-height: 1.05; letter-spacing: .04em; color: var(--amarillo); margin: 0 0 10px; }
.pdp-nombre { font-family: 'Bebas Neue', sans-serif; font-size: 1.6rem; font-weight: 400; letter-spacing: .05em; color: var(--texto); margin: 0 0 8px; }
.pdp-rating { margin-bottom: 12px; }
.pdp-link-resenas { background: none; border: none; padding: 0; color: var(--texto-suave); font: inherit; font-size: .82rem; text-decoration: underline; cursor: pointer; }
.pdp-desc { color: var(--texto-suave); font-size: .92rem; line-height: 1.6; margin: 0 0 18px; }
.pdp-precio { display: flex; align-items: baseline; flex-wrap: wrap; gap: 12px; }
.pdp-precio-total { font-size: 2.1rem; font-weight: 700; color: var(--amarillo); }
.pdp-precio-antes { color: var(--texto-tenue); font-size: 1.05rem; }
.pdp-precio-unit { color: var(--texto-suave); font-size: .85rem; }
.pdp-por-dia { margin: 4px 0 10px; color: var(--texto-suave); font-size: .82rem; }
.pdp-stock { display: inline-flex; align-items: center; gap: 8px; border: 1px solid; border-radius: 50px; padding: 5px 12px; font-size: .76rem; font-weight: 600; }
.pdp-stock-dot { width: 7px; height: 7px; border-radius: 50%; }
.combos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 20px 0 14px; }
.combo { position: relative; display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 16px 6px 12px; background: var(--fondo-2); border: 1.5px solid var(--borde); border-radius: 10px; color: var(--texto); font: inherit; cursor: pointer; transition: border-color .2s, box-shadow .2s; }
.combo:hover:not(:disabled) { border-color: #f5c80088; }
.combo.activo { border-color: var(--amarillo); box-shadow: inset 0 0 0 1px var(--amarillo); }
.combo:disabled { opacity: .45; cursor: not-allowed; }
.combo-tag { position: absolute; top: -9px; background: #f5c800; color: #000; font-size: .58rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; padding: 2px 8px; border-radius: 20px; white-space: nowrap; }
.combo-n { font-family: 'Bebas Neue', sans-serif; font-size: 1.5rem; letter-spacing: .05em; }
.combo-txt { font-size: .72rem; color: var(--texto-suave); }
.combo-total { margin-top: 4px; font-size: .95rem; font-weight: 700; }
.combo-unit { font-size: .7rem; color: var(--texto-suave); }
.combo-ahorro { font-size: .68rem; font-weight: 700; color: #4caf50; }
.sus { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
.sus-op { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 4px 10px; padding: 12px 14px; background: var(--fondo-2); border: 1.5px solid var(--borde); border-radius: 10px; cursor: pointer; }
.sus-op.activo { border-color: var(--amarillo); }
.sus-op input { accent-color: #f5c800; margin: 0; }
.sus-titulo { font-size: .9rem; font-weight: 600; }
.sus-precio { font-weight: 700; color: var(--amarillo); }
.sus-detalle { grid-column: 2 / 4; display: flex; flex-wrap: wrap; align-items: center; gap: 6px 8px; font-size: .82rem; color: var(--texto-suave); }
.sus-detalle select { background: var(--fondo-3); color: var(--texto); border: 1px solid var(--borde); border-radius: 6px; padding: 4px 8px; font: inherit; }
.sus-detalle small { flex-basis: 100%; font-size: .74rem; color: var(--texto-tenue); }
.pdp-cta { display: flex; flex-direction: column; gap: 10px; margin: 8px 0 18px; }
.pdp-btn-comprar { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 16px; background: #f5c800; color: #000; border: none; border-radius: 8px; font: inherit; font-size: .95rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; cursor: pointer; transition: background .2s, box-shadow .2s; }
.pdp-btn-comprar:hover:not(:disabled) { background: #ffd700; box-shadow: 0 6px 20px rgba(245,200,0,.3); }
.pdp-btn-agregar { padding: 14px; background: transparent; color: var(--texto); border: 1.5px solid var(--borde); border-radius: 8px; font: inherit; font-size: .85rem; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; cursor: pointer; transition: border-color .2s, color .2s; }
.pdp-btn-agregar:hover:not(:disabled) { border-color: var(--amarillo); color: var(--amarillo); }
.pdp-cta button:disabled, .res-form button:disabled { opacity: .5; cursor: not-allowed; box-shadow: none; }
.pdp-express-nota { margin: 0; text-align: center; font-size: .74rem; color: var(--texto-tenue); }
.pdp-error { background: #ff4444; color: #fff; padding: 10px 14px; border-radius: 6px; font-size: .82rem; }
.pdp-garantia { background: var(--fondo-2); border: 1px solid var(--borde); border-radius: 10px; padding: 14px 16px; margin-bottom: 14px; }
.pdp-garantia-titulo { margin: 0 0 8px; font-size: .88rem; font-weight: 700; }
.pdp-garantia-titulo i { color: #4caf50; }
.pdp-garantia ul { margin: 0; padding-left: 18px; color: var(--texto-suave); font-size: .8rem; line-height: 1.6; }
.pdp-sellos { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 8px; }
.pdp-sellos li { display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--borde); border-radius: 30px; padding: 6px 12px; font-size: .74rem; color: var(--texto-suave); }
.pdp-sellos i { color: var(--amarillo); }
.pdp-seccion { max-width: 1150px; margin: 56px auto 0; }
.pdp-seccion > h2 { font-family: 'Bebas Neue', sans-serif; font-size: clamp(1.6rem, 3vw, 2.2rem); font-weight: 400; letter-spacing: .06em; margin: 0 0 18px; }
.pdp-seccion > h2 span { color: var(--amarillo); }
.texto-largo { margin: 0; white-space: pre-line; color: var(--texto-suave); font-size: .92rem; line-height: 1.7; }
.tabs { display: flex; gap: 6px; border-bottom: 1px solid var(--borde); margin-bottom: 16px; overflow-x: auto; }
.tabs button { background: none; border: none; border-bottom: 2px solid transparent; color: var(--texto-suave); padding: 10px 14px; font: inherit; font-size: .88rem; font-weight: 600; white-space: nowrap; cursor: pointer; }
.tabs button.activo { color: var(--texto); border-bottom-color: var(--amarillo); }
.specs { width: 100%; border-collapse: collapse; font-size: .88rem; }
.specs th, .specs td { text-align: left; vertical-align: top; padding: 10px 12px; border-bottom: 1px solid var(--borde); }
.specs th { width: 40%; color: var(--texto-suave); font-weight: 500; }
.respaldo ul { margin: 0 0 12px; padding-left: 18px; color: var(--texto-suave); line-height: 1.7; }
.respaldo a { color: var(--amarillo); }
.res-resumen { display: grid; grid-template-columns: 200px 1fr; gap: 24px; align-items: center; margin-bottom: 24px; }
.res-promedio { font-family: 'Bebas Neue', sans-serif; font-size: 3.6rem; line-height: 1; }
.res-dist { display: flex; flex-direction: column; gap: 6px; }
.res-dist-fila { display: grid; grid-template-columns: 34px 1fr 30px; align-items: center; gap: 8px; font-size: .78rem; color: var(--texto-suave); }
.res-dist-fila i { color: #f5c800; font-size: .7rem; }
.res-dist-track { height: 8px; background: var(--fondo-3); border-radius: 8px; overflow: hidden; }
.res-dist-fill { height: 100%; background: #f5c800; }
.ugc { margin-bottom: 24px; }
.ugc h3 { margin: 0 0 12px; font-size: .95rem; }
.ugc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 10px; }
.ugc-grid button, .res-foto { aspect-ratio: 1; padding: 0; background: #000; border: 1px solid var(--borde); border-radius: 8px; overflow: hidden; cursor: pointer; }
.ugc-grid img, .res-foto img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .3s; }
.ugc-grid button:hover img { transform: scale(1.05); }
.res-lista { display: flex; flex-direction: column; gap: 14px; }
.res-item { background: var(--fondo-2); border: 1px solid var(--borde); border-radius: 10px; padding: 16px 18px; }
.res-head { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-bottom: 6px; font-size: .78rem; color: var(--texto-tenue); }
.res-verif { color: #4caf50; font-weight: 600; }
.res-titulo { margin: 4px 0; font-size: .92rem; font-weight: 700; }
.res-texto { margin: 0; white-space: pre-line; color: var(--texto-suave); font-size: .88rem; line-height: 1.6; }
.res-foto { width: 84px; margin-top: 10px; }
.res-vacio { padding: 24px; border: 1px dashed var(--borde); border-radius: 10px; text-align: center; color: var(--texto-suave); font-size: .9rem; }
.res-acciones { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-top: 16px; }
.res-nota, .res-gracias { font-size: .82rem; color: var(--texto-suave); }
.res-gracias { color: #4caf50; font-weight: 600; }
.btn-sec { display: inline-block; background: transparent; border: 1.5px solid var(--borde); color: var(--texto); padding: 10px 18px; border-radius: 30px; font: inherit; font-size: .82rem; font-weight: 600; text-decoration: none; cursor: pointer; transition: border-color .2s, color .2s; }
.btn-sec:hover { border-color: var(--amarillo); color: var(--amarillo); }
.res-form { display: flex; flex-direction: column; gap: 12px; margin-top: 16px; padding: 18px; background: var(--fondo-2); border: 1px solid var(--borde); border-radius: 10px; }
.res-form label, .res-label { display: flex; flex-direction: column; gap: 6px; font-size: .8rem; color: var(--texto-suave); }
.res-form input[type=text], .res-form textarea { background: var(--fondo-3); color: var(--texto); border: 1px solid var(--borde); border-radius: 6px; padding: 10px 12px; font: inherit; font-size: .9rem; }
.res-estrellas-input { display: flex; gap: 4px; }
.res-estrellas-input button { background: none; border: none; padding: 2px; color: #f5c800; font-size: 1.5rem; cursor: pointer; }
.res-msg { margin: 0; color: #ff6b6b; font-size: .82rem; }
.lightbox { position: fixed; inset: 0; z-index: 3200; display: flex; align-items: center; justify-content: center; padding: 20px; background: rgba(0,0,0,.92); }
.lightbox-box { width: 100%; max-width: 640px; background: var(--fondo-2); border: 1px solid var(--borde); border-radius: 12px; overflow: hidden; }
.lightbox-box img { display: block; width: 100%; max-height: 70vh; object-fit: contain; background: #000; }
.lightbox-info { padding: 14px 18px 4px; color: var(--texto-suave); font-size: .88rem; }
.lightbox-cerrar { margin: 0 18px 16px; }
.tc-wrap { overflow-x: auto; }
.tc { width: 100%; min-width: 480px; border-collapse: collapse; font-size: .88rem; }
.tc th, .tc td { padding: 12px 14px; border-bottom: 1px solid var(--borde); text-align: center; }
.tc th:first-child, .tc td:first-child { text-align: left; font-weight: 500; }
.tc thead th { font-family: 'Bebas Neue', sans-serif; font-size: 1.1rem; font-weight: 400; letter-spacing: .05em; color: var(--texto-suave); }
.tc thead th.nosotros { color: var(--amarillo); }
.tc td.nosotros { background: #f5c80012; }
.tc .ok { color: #4caf50; font-size: 1.1rem; }
.tc .no { color: #ff6b6b; font-size: 1.1rem; }
.tc-txt { color: var(--texto-tenue); font-size: .8rem; }
.tl { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 18px; counter-reset: paso; }
.tl li { position: relative; background: var(--fondo-2); border: 1px solid var(--borde); border-radius: 10px; padding: 20px 16px 16px; }
.tl li::before { counter-increment: paso; content: counter(paso); position: absolute; top: -12px; left: 16px; width: 26px; height: 26px; border-radius: 50%; background: #f5c800; color: #000; font-size: .8rem; font-weight: 700; display: flex; align-items: center; justify-content: center; }
.tl-cuando { display: block; margin: 4px 0; color: var(--amarillo); font-size: .7rem; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; }
.tl strong { display: block; margin-bottom: 4px; }
.tl p { margin: 0; color: var(--texto-suave); font-size: .85rem; line-height: 1.55; }
.faq-item { border-bottom: 1px solid var(--borde); }
.faq-item button { width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 12px; background: none; border: none; color: var(--texto); padding: 16px 4px; font: inherit; font-size: .95rem; font-weight: 600; text-align: left; cursor: pointer; }
.faq-item button i { color: var(--amarillo); transition: transform .2s; }
.faq-item button[aria-expanded="true"] i { transform: rotate(45deg); }
.faq-item p { margin: 0 4px 16px; color: var(--texto-suave); font-size: .9rem; line-height: 1.65; }
.pdp-disclaimer { max-width: 1150px; margin: 48px auto 0; padding-top: 18px; border-top: 1px solid var(--borde); }
.pdp-disclaimer ul { margin: 0; padding-left: 18px; color: var(--texto-tenue); font-size: .74rem; line-height: 1.7; }
.barra-fija { position: fixed; left: 0; right: 0; bottom: 0; z-index: 1500; display: flex; align-items: center; gap: 12px; padding: 10px max(16px, calc((100vw - 1150px) / 2)); background: var(--fondo-2); border-top: 1px solid var(--borde); box-shadow: 0 -8px 30px rgba(0,0,0,.35); transform: translateY(110%); transition: transform .25s ease; }
.barra-fija.visible { transform: translateY(0); }
.bf-img { width: 46px; height: 46px; flex-shrink: 0; border-radius: 8px; object-fit: cover; }
.bf-info { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.bf-nombre { font-size: .85rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bf-precio { color: var(--amarillo); font-weight: 700; }
.bf-agregar, .bf-comprar { padding: 12px 16px; border-radius: 8px; font: inherit; font-size: .78rem; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; white-space: nowrap; cursor: pointer; }
.bf-agregar { background: transparent; color: var(--texto); border: 1.5px solid var(--borde); }
.bf-comprar { background: #f5c800; color: #000; border: none; }
.bf-comprar:disabled { opacity: .6; cursor: not-allowed; }
.pdp-estado { max-width: 520px; margin: 0 auto; padding: 80px 20px; text-align: center; color: var(--texto-suave); }
@media (max-width: 860px) {
  .pdp { padding: 12px 16px 120px; }
  .pdp-top { grid-template-columns: 1fr; gap: 24px; }
  .pdp-galeria { position: static; }
  /* en móvil la imagen más baja para que titular y precio queden arriba del pliegue */
  .pdp-img-main { aspect-ratio: 4 / 3; }
  .pdp-thumbs button { width: 56px; height: 56px; }
}
@media (max-width: 600px) {
  .res-resumen { grid-template-columns: 1fr; }
  .combo { padding: 14px 4px 10px; }
}
@media (max-width: 520px) {
  .bf-img, .bf-agregar { display: none; }
}
`;

export default Producto;
