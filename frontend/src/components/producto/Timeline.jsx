import { TIENDA } from "../../config/tienda";

function Timeline({ categoria }) {
  const { titulo, pasos } = TIENDA.timeline;
  const lista = pasos[categoria] || pasos.default;
  return (
    <section className="pdp-seccion" aria-labelledby="titulo-timeline">
      <h2 id="titulo-timeline">{titulo}</h2>
      <ol className="tl">
        {lista.map((p) => (
          <li key={p.titulo}>
            <span className="tl-cuando">{p.cuando}</span>
            <strong>{p.titulo}</strong>
            <p>{p.texto}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default Timeline;
