import { useState } from "react";

// specs / modo de uso / respaldo técnico (todo sale del admin del producto)
function Especificaciones({ producto }) {
  const tabs = [];
  if (producto.especificaciones?.length) tabs.push({ id: "specs", label: "Especificaciones" });
  if (producto.modo_uso) tabs.push({ id: "uso", label: "Modo de uso" });
  if (producto.certificaciones?.length || producto.ficha_tecnica_url) {
    tabs.push({ id: "respaldo", label: "Respaldo técnico" });
  }
  const [tab, setTab] = useState(null);
  if (!tabs.length) return null;
  const activo = tabs.some((t) => t.id === tab) ? tab : tabs[0].id;

  return (
    <section className="pdp-seccion" aria-labelledby="titulo-specs">
      <h2 id="titulo-specs">
        Detalles <span>técnicos</span>
      </h2>
      <div className="tabs" role="tablist">
        {tabs.map((t) => (
          <button
            type="button"
            role="tab"
            key={t.id}
            aria-selected={activo === t.id}
            className={activo === t.id ? "activo" : ""}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {activo === "specs" && (
          <table className="specs">
            <tbody>
              {producto.especificaciones.map((s, i) =>
                s.nombre ? (
                  <tr key={i}>
                    <th scope="row">{s.nombre}</th>
                    <td>{s.valor}</td>
                  </tr>
                ) : (
                  <tr key={i}>
                    <td colSpan={2}>{s.valor}</td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        )}
        {activo === "uso" && <p className="texto-largo">{producto.modo_uso}</p>}
        {activo === "respaldo" && (
          <div className="respaldo">
            {producto.certificaciones?.length > 0 && (
              <ul>
                {producto.certificaciones.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            )}
            {producto.ficha_tecnica_url && (
              <a href={producto.ficha_tecnica_url} target="_blank" rel="noopener noreferrer">
                Ver ficha técnica / certificado <i className="bi bi-box-arrow-up-right" aria-hidden="true" />
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default Especificaciones;
