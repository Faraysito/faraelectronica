import { useNavigate } from "react-router-dom";

/**
 * Página 404 propia, en la identidad de Fara Electrónica.
 *
 * Una SPA sin 404 deja al usuario en blanco cuando escribe una ruta mala.
 * Esto da una salida clara de vuelta al catálogo.
 *
 * Colocar en: frontend/src/pages/NoEncontrado.jsx
 * Añadir como última ruta en App.jsx:
 *   <Route path="*" element={wrap(<NoEncontrado />)} />
 */
function NoEncontrado() {
  const navigate = useNavigate();

  return (
    <div className="ne-wrap">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;600&display=swap');
        .ne-wrap { background:#0a0a0a; min-height:calc(100vh - 100px); display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:40px 24px; }
        .ne-codigo { font-family:'Bebas Neue',sans-serif; font-size:clamp(6rem,22vw,12rem); line-height:0.9; color:#f5c800; letter-spacing:0.02em; text-shadow:0 0 40px rgba(245,200,0,0.25); margin:0; }
        .ne-titulo { font-family:'Bebas Neue',sans-serif; font-size:clamp(1.6rem,5vw,2.6rem); color:#f5f5f5; letter-spacing:0.06em; margin:8px 0 12px; }
        .ne-texto { font-family:'DM Sans',sans-serif; font-size:0.95rem; font-weight:300; color:#888; max-width:420px; line-height:1.6; margin:0 0 32px; }
        .ne-botones { display:flex; gap:12px; flex-wrap:wrap; justify-content:center; }
        .ne-btn { font-family:'DM Sans',sans-serif; font-size:0.78rem; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; padding:13px 26px; border-radius:50px; cursor:pointer; transition:all 0.3s ease; }
        .ne-btn-primario { background:#f5c800; border:none; color:#000; }
        .ne-btn-primario:hover { background:#ffd700; box-shadow:0 4px 16px rgba(245,200,0,0.3); }
        .ne-btn-sec { background:transparent; border:1px solid #333; color:#aaa; }
        .ne-btn-sec:hover { border-color:#f5c800; color:#f5c800; }
      `}</style>

      <p className="ne-codigo">404</p>
      <h1 className="ne-titulo">Esta página no existe</h1>
      <p className="ne-texto">
        El enlace que seguiste puede estar roto o la página se movió. Vuelve al
        inicio o revisa nuestro catálogo de productos.
      </p>
      <div className="ne-botones">
        <button
          className="ne-btn ne-btn-primario"
          onClick={() => navigate("/")}
        >
          Ir al inicio
        </button>
        <button
          className="ne-btn ne-btn-sec"
          onClick={() => navigate("/camaras")}
        >
          Ver cámaras
        </button>
      </div>
    </div>
  );
}

export default NoEncontrado;
