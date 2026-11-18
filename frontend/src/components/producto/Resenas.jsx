import { useEffect, useState } from "react";
import { API_URL } from "../../lib/api";
import Estrellas from "./Estrellas";

const VISIBLES = 4;

const fecha = (iso) =>
  new Date(iso).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });

function primerError(data, status) {
  if (status === 401) return "Tu sesión expiró, vuelve a iniciar sesión.";
  if (data?.error) return data.error;
  const valor = data ? Object.values(data)[0] : null;
  return Array.isArray(valor) ? valor[0] : "No se pudo enviar la reseña.";
}

function FormResena({ productoId, onEnviada }) {
  const [calificacion, setCalificacion] = useState(5);
  const [titulo, setTitulo] = useState("");
  const [comentario, setComentario] = useState("");
  const [foto, setFoto] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const enviar = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("access_token");
    if (!token) {
      setMensaje("Inicia sesión para dejar tu reseña.");
      return;
    }
    setEnviando(true);
    setMensaje(null);
    const datos = new FormData();
    datos.append("calificacion", calificacion);
    datos.append("titulo", titulo);
    datos.append("comentario", comentario);
    if (foto) datos.append("foto", foto);
    try {
      const res = await fetch(`${API_URL}/api/productos/${productoId}/resenas/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: datos,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMensaje(primerError(data, res.status));
        setEnviando(false);
        return;
      }
      onEnviada();
    } catch {
      setMensaje("Error de conexión con el servidor.");
      setEnviando(false);
    }
  };

  return (
    <form className="res-form" onSubmit={enviar}>
      <div>
        <span className="res-label">Tu calificación</span>
        <div className="res-estrellas-input" role="radiogroup" aria-label="Calificación">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              role="radio"
              aria-checked={calificacion === n}
              aria-label={`${n} ${n === 1 ? "estrella" : "estrellas"}`}
              onClick={() => setCalificacion(n)}
            >
              <i className={`bi ${n <= calificacion ? "bi-star-fill" : "bi-star"}`} aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
      <label>
        Título (opcional)
        <input type="text" maxLength={80} value={titulo} onChange={(e) => setTitulo(e.target.value)} />
      </label>
      <label>
        Tu opinión
        <textarea
          required
          maxLength={1000}
          rows={4}
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
        />
      </label>
      <label>
        Foto del producto (opcional, máx. 5 MB)
        <input type="file" accept="image/*" onChange={(e) => setFoto(e.target.files?.[0] || null)} />
      </label>
      {mensaje && <p className="res-msg">{mensaje}</p>}
      <button type="submit" className="pdp-btn-comprar" disabled={enviando}>
        {enviando ? "Enviando..." : "Publicar reseña"}
      </button>
    </form>
  );
}

// reseñas reales (solo compradores con orden pagada) + galería de fotos de clientes (UGC)
function Resenas({ productoId, mostrarResenas = true, mostrarUgc = true }) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(false);
  const [version, setVersion] = useState(0);
  const [verTodas, setVerTodas] = useState(false);
  const [abierta, setAbierta] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [gracias, setGracias] = useState(false);
  const [logueado] = useState(() => !!localStorage.getItem("user"));

  useEffect(() => {
    let activo = true;
    fetch(`${API_URL}/api/productos/${productoId}/resenas/`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d) => {
        if (!activo) return;
        setDatos(d);
        setError(false);
      })
      .catch(() => {
        if (activo) setError(true);
      });
    return () => {
      activo = false;
    };
  }, [productoId, version]);

  const resenas = datos?.resenas || [];
  const resumen = datos?.resumen;
  const conFoto = resenas.filter((r) => r.foto);
  const lista = verTodas ? resenas : resenas.slice(0, VISIBLES);

  return (
    <section className="pdp-seccion" aria-labelledby="titulo-resenas">
      <h2 id="titulo-resenas">
        Lo que dicen <span>nuestros clientes</span>
      </h2>

      {error && <p className="res-vacio">No pudimos cargar las reseñas ahora.</p>}

      {mostrarResenas && resumen && resumen.total > 0 && (
        <div className="res-resumen">
          <div>
            <div className="res-promedio">{resumen.promedio?.toFixed(1)}</div>
            <Estrellas valor={resumen.promedio} total={resumen.total} mostrarNumero={false} />
          </div>
          <div className="res-dist">
            {["5", "4", "3", "2", "1"].map((n) => {
              const cant = resumen.distribucion?.[n] || 0;
              const pct = resumen.total ? Math.round((cant / resumen.total) * 100) : 0;
              return (
                <div className="res-dist-fila" key={n}>
                  <span>
                    {n} <i className="bi bi-star-fill" aria-hidden="true" />
                  </span>
                  <div className="res-dist-track">
                    <div className="res-dist-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span>{cant}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {mostrarUgc && conFoto.length > 0 && (
        <div className="ugc">
          <h3>Fotos de clientes</h3>
          <div className="ugc-grid">
            {conFoto.map((r) => (
              <button type="button" key={r.id} onClick={() => setAbierta(r)} aria-label={`Foto de ${r.autor}`}>
                <img src={r.foto} alt={`Foto de ${r.autor}`} loading="lazy" />
              </button>
            ))}
          </div>
        </div>
      )}

      {mostrarResenas && datos && resenas.length === 0 && (
        <p className="res-vacio">
          Todavía no hay reseñas de este producto. Si lo compraste, cuéntanos qué te pareció.
        </p>
      )}

      {mostrarResenas && lista.length > 0 && (
        <div className="res-lista">
          {lista.map((r) => (
            <article className="res-item" key={r.id}>
              <div className="res-head">
                <Estrellas valor={r.calificacion} tamano="sm" />
                <span>
                  {r.autor}
                  {r.compra_verificada && <span className="res-verif"> · Compra verificada</span>} ·{" "}
                  {fecha(r.created_at)}
                </span>
              </div>
              {r.titulo && <p className="res-titulo">{r.titulo}</p>}
              <p className="res-texto">{r.comentario}</p>
              {r.foto && (
                <button type="button" className="res-foto" onClick={() => setAbierta(r)} aria-label="Ver foto">
                  <img src={r.foto} alt="" loading="lazy" />
                </button>
              )}
            </article>
          ))}
        </div>
      )}

      {mostrarResenas && (
        <div className="res-acciones">
          {resenas.length > VISIBLES && (
            <button type="button" className="btn-sec" onClick={() => setVerTodas((v) => !v)}>
              {verTodas ? "Ver menos" : `Ver las ${resenas.length} reseñas`}
            </button>
          )}
          {gracias ? (
            <span className="res-gracias">¡Gracias por tu reseña!</span>
          ) : logueado ? (
            <button type="button" className="btn-sec" onClick={() => setMostrarForm((v) => !v)}>
              {mostrarForm ? "Cancelar" : "Escribir una reseña"}
            </button>
          ) : (
            <span className="res-nota">¿Lo compraste? Inicia sesión para dejar tu reseña.</span>
          )}
        </div>
      )}

      {mostrarResenas && mostrarForm && !gracias && (
        <FormResena
          productoId={productoId}
          onEnviada={() => {
            setMostrarForm(false);
            setGracias(true);
            setVersion((v) => v + 1);
          }}
        />
      )}

      {abierta && (
        <div className="lightbox" onClick={() => setAbierta(null)} role="dialog" aria-modal="true">
          <div className="lightbox-box" onClick={(e) => e.stopPropagation()}>
            <img src={abierta.foto} alt={`Foto de ${abierta.autor}`} />
            <div className="lightbox-info">
              <Estrellas valor={abierta.calificacion} tamano="sm" />
              <p>{abierta.comentario}</p>
              <small>
                {abierta.autor}
                {abierta.compra_verificada && " · Compra verificada"}
              </small>
            </div>
            <button type="button" className="btn-sec lightbox-cerrar" onClick={() => setAbierta(null)}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default Resenas;
