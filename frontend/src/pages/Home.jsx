import { useNavigate } from "react-router-dom";
import { useState } from "react";
import imgCamaras from "../assets/images/camaras.jpg";
import imgCalefaccion from "../assets/images/calefaccion.jpg";
import imgProximamente from "../assets/images/proximamente.avif";

const categorias = [
  {
    id: "camaras",
    titulo: "Cámaras de Seguridad",
    descripcion: "Vigilancia profesional para tu hogar y negocio.",
    imagen: imgCamaras,
    acento: "#f5c800",
    ruta: "/camaras",
  },
  {
    id: "calefaccion",
    titulo: "Calefacción",
    descripcion: "Equipos de calefacción eficientes para cada espacio.",
    imagen: imgCalefaccion,
    acento: "#f5c800",
    ruta: "/calefaccion",
  },
  {
    id: "proximamente",
    titulo: "Próximamente",
    descripcion: "Estamos trabajando para traer más productos.",
    imagen: imgProximamente,
    acento: "#444",
    ruta: "",
  },
];

function Home() {
  const navigate = useNavigate();

  const [mostrarAviso, setMostrarAviso] = useState(() => {
    return !sessionStorage.getItem("fara_aviso_visto");
  });

  const cerrarAviso = () => {
    sessionStorage.setItem("fara_aviso_visto", "true");
    setMostrarAviso(false);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500&display=swap');

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.88);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999;
          padding: 24px;
        }

        .modal-box {
          background: #111;
          border: 1px solid #2a2a00;
          border-radius: 8px;
          padding: 40px 36px;
          max-width: 540px;
          width: 100%;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .modal-box::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #f5c800, transparent);
        }

        .modal-tag {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.65rem;
          font-weight: 500;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: #f5c800;
          border: 1px solid #f5c80044;
          background: #f5c80012;
          padding: 4px 12px;
          border-radius: 20px;
          display: inline-block;
          margin-bottom: 20px;
        }

        .modal-titulo {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 2rem;
          color: #f5f5f5;
          letter-spacing: 0.08em;
          margin: 0 0 16px;
        }

        .modal-texto {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.88rem;
          color: #888;
          font-weight: 300;
          line-height: 1.8;
          margin: 0 0 16px;
        }

        .modal-stack {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.8rem;
          color: #444;
          font-weight: 300;
          line-height: 1.9;
          margin: 0 0 20px;
          background: #f5c80008;
          border: 1px solid #2a2a00;
          border-radius: 6px;
          padding: 12px 16px;
          text-align: left;
        }

        .modal-stack span {
          color: #f5c800;
          font-weight: 500;
        }

        .modal-nota {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.78rem;
          color: #3a3a3a;
          font-style: italic;
          margin: 0 0 28px;
          line-height: 1.6;
        }

        .modal-btn {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          background: #f5c800;
          border: none;
          color: #0a0a0a;
          padding: 12px 28px;
          border-radius: 3px;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .modal-btn:hover {
          background: #e6b800;
        }

        .hero-section {
          min-height: calc(100vh - 60px);
          background: #0a0a0a;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 24px;
          gap: 16px;
        }

        .hero-titulo {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(2.5rem, 6vw, 5rem);
          color: #f5f5f5;
          letter-spacing: 0.08em;
          text-align: center;
          margin: 0 0 8px 0;
        }

        .hero-subtitulo {
          font-family: 'DM Sans', sans-serif;
          font-size: 1rem;
          color: #555;
          font-weight: 300;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          text-align: center;
          margin: 0 0 56px 0;
        }

        .catalogo-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 24px;
          width: 100%;
          max-width: 1200px;
        }

        @media (max-width: 900px) {
          .catalogo-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 580px) {
          .catalogo-grid {
            grid-template-columns: 1fr;
          }
        }

        .cat-card {
          position: relative;
          border-radius: 4px;
          overflow: hidden;
          cursor: pointer;
          aspect-ratio: 4/5;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          border: 1px solid #1f1f00;
        }

        .cat-card:hover { transform: scale(1.02); }
        .cat-card:hover .cat-img { transform: scale(1.06); }
        .cat-card:hover .cat-btn {
          background: #f5c800;
          border-color: #f5c800;
          color: #0a0a0a;
          font-weight: 600;
          letter-spacing: 0.2em;
        }

        .cat-card.disabled {
          cursor: default;
        }
        .cat-card.disabled:hover { transform: none; }
        .cat-card.disabled:hover .cat-img { transform: none; }

        .cat-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          filter: brightness(0.4);
        }

        .cat-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.2) 55%, transparent 100%);
        }

        .prox-overlay {
          position: absolute;
          inset: 0;
          background: rgba(10,10,10,0.8);
          z-index: 3;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 10px;
        }

        .prox-pill {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.65rem;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          background: #ffffff08;
          border: 1px solid #ffffff15;
          color: #444;
          padding: 6px 16px;
          border-radius: 20px;
        }

        .prox-dots {
          display: flex;
          gap: 6px;
        }

        .prox-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #333;
          animation: pulse 1.5s ease-in-out infinite;
        }

        .prox-dot:nth-child(2) { animation-delay: 0.2s; }
        .prox-dot:nth-child(3) { animation-delay: 0.4s; }

        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }

        .cat-contenido {
          position: relative;
          z-index: 2;
          padding: 32px 28px;
        }

        .cat-tag {
          display: inline-block;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.65rem;
          font-weight: 500;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: var(--acento);
          border: 1px solid var(--acento-border);
          padding: 3px 10px;
          border-radius: 2px;
          margin-bottom: 14px;
        }

        .cat-titulo {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(1.8rem, 3.5vw, 2.6rem);
          color: #f5f5f5;
          letter-spacing: 0.04em;
          margin: 0 0 10px 0;
          line-height: 1;
        }

        .cat-desc {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          color: #aaa;
          font-weight: 300;
          line-height: 1.6;
          margin: 0 0 22px 0;
        }

        .cat-btn {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          background: transparent;
          border: 1px solid #f5f5f533;
          color: #f5f5f5;
          padding: 10px 22px;
          border-radius: 2px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-block;
        }
          .modal-nota {
  color: #888;
}
      `}</style>

      {mostrarAviso && (
        <div className="modal-overlay">
          <div className="modal-box">
            <span className="modal-tag">Nota del desarrollador</span>
            <h2 className="modal-titulo">Un poco de contexto</h2>
            <p className="modal-texto">
              mi hermano menor necesita una página para vender sus productos,
              así que le estoy haciendo una. La pagina seguira en desarrollo,
              asi que tendra actualizaciones en diseño y funcionalidades
            </p>
            <p className="modal-stack">
              <span>Frontend:</span> React · Vite · Bootstrap · React Router ·
              JavaScript · CSS
              <br />
              <span>Backend:</span> Python · Django · Django REST Framework ·
              Gunicorn · Whitenoise
              <br />
              <span>Base de datos:</span> PostgreSQL (Supabase)
              <br />
              <span>Despliegue:</span> Vercel · Render · Cloudinary · Supabase
            </p>
            <p className="modal-nota">
              La página está lejos de estar terminada, pero es una pequeña
              muestra del trabajo que puedo hacer.
            </p>
            <p className="modal-nota">
              a veces tarda en iniciar sesion y mostrar los productos, cuando no
              hay trafico, el host entra en reposo y puede demorar ~40 segundos
              en despertar.
            </p>
            <p className="modal-nota">
              ya migre la base de datos a Supabase despues de que la instancia
              free de Render expirara. todo funcionando: login con Google,
              productos guardandose y mostrandose correctamente 
            </p>

            <button className="modal-btn" onClick={cerrarAviso}>
              VEAMOS LA PAGINA →
            </button>
          </div>
        </div>
      )}

      <div className="hero-section">
        <h1 className="hero-titulo">Nuestros Catálogos</h1>
        <p className="hero-subtitulo">Selecciona una categoría para explorar</p>

        <div className="catalogo-grid">
          {categorias.map((cat) => (
            <div
              key={cat.id}
              className={`cat-card ${cat.ruta === "" ? "disabled" : ""}`}
              style={{
                "--acento": cat.acento,
                "--acento-border": cat.acento + "55",
              }}
              onClick={() => cat.ruta && navigate(cat.ruta)}
            >
              <img src={cat.imagen} alt={cat.titulo} className="cat-img" />
              <div className="cat-overlay" />
              {cat.ruta === "" && (
                <div className="prox-overlay">
                  <span className="prox-pill">Próximamente</span>
                  <div className="prox-dots">
                    <div className="prox-dot" />
                    <div className="prox-dot" />
                    <div className="prox-dot" />
                  </div>
                </div>
              )}
              <div className="cat-contenido">
                <span className="cat-tag">Catálogo</span>
                <h2 className="cat-titulo">{cat.titulo}</h2>
                <p className="cat-desc">{cat.descripcion}</p>
                {cat.ruta !== "" && (
                  <button className="cat-btn">Ver productos →</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default Home;