import { useState } from "react";

function Galeria({ producto }) {
  const imagenes = [
    producto.imagen_principal,
    ...(producto.imagenes || []).map((i) => i.imagen),
  ].filter(Boolean);
  const [idx, setIdx] = useState(0);

  return (
    <div className="pdp-galeria">
      <div className="pdp-img-main">
        {producto.agotado && <span className="pdp-agotado">Agotado</span>}
        {imagenes[idx] && <img src={imagenes[idx]} alt={producto.nombre} />}
      </div>
      {imagenes.length > 1 && (
        <div className="pdp-thumbs">
          {imagenes.map((src, i) => (
            <button
              type="button"
              key={src + i}
              className={i === idx ? "activo" : ""}
              onClick={() => setIdx(i)}
              aria-label={`Ver imagen ${i + 1}`}
            >
              <img src={src} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default Galeria;
