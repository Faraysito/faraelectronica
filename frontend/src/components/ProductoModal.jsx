import React, { useState, useRef } from "react";

const ProductoModal = ({ producto, onClose }) => {
  const imagenes = [
    producto.imagen_principal,
    ...(producto.imagenes?.map((i) => i.imagen) || []),
  ];
  const [idx, setIdx] = useState(0);
  const [fade, setFade] = useState(true);
  const [zoom, setZoom] = useState(false);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const imgWrapRef = useRef(null);

  const nav = (dir) => {
    setFade(false);
    setTimeout(() => {
      setIdx((prev) => (prev + dir + imagenes.length) % imagenes.length);
      setFade(true);
    }, 200);
  };

  const handleMouseMove = (e) => {
    if (!imgWrapRef.current) return;
    const rect = imgWrapRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPos({ x, y });
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.9)",
        zIndex: 3000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--fondo-2, #111)",
          maxWidth: "900px",
          width: "100%",
          display: "flex",
          flexWrap: "wrap",
          borderRadius: "12px",
          overflow: "hidden",
          border: "1px solid var(--borde, #333)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          ref={imgWrapRef}
          style={{
            flex: "1 1 500px",
            background: "#000",
            position: "relative",
            height: "450px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: zoom ? "zoom-out" : "zoom-in",
            overflow: "hidden",
          }}
          onMouseEnter={() => setZoom(true)}
          onMouseLeave={() => setZoom(false)}
          onMouseMove={handleMouseMove}
        >
          <img
            src={imagenes[idx]}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              opacity: fade ? 1 : 0,
              transform: zoom ? "scale(2)" : fade ? "scale(1)" : "scale(0.97)",
              transformOrigin: pos.x + "% " + pos.y + "%",
              transition: zoom
                ? "transform 0.1s ease-out, opacity 0.25s ease"
                : "opacity 0.25s ease, transform 0.25s ease",
            }}
            alt="slide"
          />

          {imagenes.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nav(-1);
                }}
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  background: "#f5c800",
                  border: "none",
                  padding: "10px",
                  cursor: "pointer",
                  borderRadius: "4px",
                  fontWeight: "bold",
                  zIndex: 2,
                }}
              >
                {"\u276E"}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nav(1);
                }}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  background: "#f5c800",
                  border: "none",
                  padding: "10px",
                  cursor: "pointer",
                  borderRadius: "4px",
                  fontWeight: "bold",
                  zIndex: 2,
                }}
              >
                {"\u276F"}
              </button>
            </>
          )}
        </div>

        <div
          style={{
            flex: "1 1 300px",
            padding: "30px",
            color: "var(--texto, #fff)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <h2
            style={{
              fontFamily: "Bebas Neue",
              fontSize: "2.5rem",
              margin: "0 0 10px 0",
              color: "var(--texto, #f5f5f5)",
            }}
          >
            {producto.nombre}
          </h2>
          <p
            style={{
              color: "#f5c800",
              fontSize: "1.8rem",
              fontWeight: "bold",
              margin: "0 0 15px 0",
            }}
          >
            ${producto.precio ? producto.precio.toLocaleString("es-CL") : "0"}
          </p>
          <p
            style={{
              color: "var(--texto-suave, #aaa)",
              fontSize: "0.95rem",
              lineHeight: "1.6",
              marginBottom: "16px",
              fontFamily: "DM Sans, sans-serif",
            }}
          >
            {producto.descripcion_larga || producto.descripcion}
          </p>
          <p
            style={{
              color: "var(--texto-tenue, #666)",
              fontSize: "0.72rem",
              fontStyle: "italic",
              marginBottom: "20px",
              fontFamily: "DM Sans, sans-serif",
            }}
          >
            Pasa el cursor sobre la imagen para ampliar.
          </p>

          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "1px solid var(--borde, #444)",
              color: "var(--texto-suave, #888)",
              width: "100%",
              padding: "12px",
              cursor: "pointer",
              borderRadius: "6px",
              fontFamily: "DM Sans, sans-serif",
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductoModal;
