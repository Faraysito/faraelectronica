// 0 a 5 estrellas con medias (bootstrap-icons viene en index.html)
function Estrellas({ valor = 0, total, tamano = "md", onClick, mostrarNumero = true }) {
  const redondeado = Math.round((Number(valor) || 0) * 2) / 2;
  const icono = (i) => {
    if (redondeado >= i) return "bi-star-fill";
    if (redondeado === i - 0.5) return "bi-star-half";
    return "bi-star";
  };
  const fuente = { sm: "0.78rem", md: "0.95rem", lg: "1.3rem" }[tamano] || "0.95rem";
  const etiqueta = `${Number(valor || 0).toFixed(1)} de 5 estrellas${
    total != null ? `, ${total} ${total === 1 ? "reseña" : "reseñas"}` : ""
  }`;

  const contenido = (
    <>
      <span aria-hidden="true" style={{ color: "#f5c800", letterSpacing: "1px" }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <i key={i} className={`bi ${icono(i)}`} />
        ))}
      </span>
      {mostrarNumero && valor != null && (
        <span aria-hidden="true" style={{ fontWeight: 700 }}>
          {Number(valor).toFixed(1)}
        </span>
      )}
      {total != null && (
        <span aria-hidden="true" style={{ opacity: 0.7 }}>
          ({total} {total === 1 ? "reseña" : "reseñas"})
        </span>
      )}
    </>
  );

  const estilo = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: fuente,
    color: "var(--texto-suave, #aaa)",
  };

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={`${etiqueta}. Ver reseñas`}
        style={{ ...estilo, background: "none", border: "none", padding: 0, cursor: "pointer" }}
      >
        {contenido}
      </button>
    );
  }
  return (
    <span role="img" aria-label={etiqueta} style={estilo}>
      {contenido}
    </span>
  );
}

export default Estrellas;
