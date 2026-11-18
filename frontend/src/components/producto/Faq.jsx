import { useState } from "react";
import { TIENDA, rellenar } from "../../config/tienda";

function Faq({ categoria, condiciones = {}, valores = {} }) {
  const [abierta, setAbierta] = useState(0);
  const items = [...TIENDA.faq.general, ...(TIENDA.faq[categoria] || [])].filter(
    (f) => !f.si || condiciones[f.si],
  );
  if (!items.length) return null;

  return (
    <section className="pdp-seccion" aria-labelledby="titulo-faq">
      <h2 id="titulo-faq">{TIENDA.faq.titulo}</h2>
      <div>
        {items.map((f, i) => (
          <div className="faq-item" key={f.p}>
            <button
              type="button"
              aria-expanded={abierta === i}
              aria-controls={`faq-${i}`}
              onClick={() => setAbierta(abierta === i ? -1 : i)}
            >
              {f.p}
              <i className="bi bi-plus-lg" aria-hidden="true" />
            </button>
            {abierta === i && <p id={`faq-${i}`}>{rellenar(f.r, valores)}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

export default Faq;
