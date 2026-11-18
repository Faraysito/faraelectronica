import { TIENDA } from "../../config/tienda";

function Garantia() {
  const { titulo, puntos } = TIENDA.garantia;
  return (
    <div className="pdp-garantia">
      <p className="pdp-garantia-titulo">
        <i className="bi bi-shield-check" aria-hidden="true" /> {titulo}
      </p>
      <ul>
        {puntos.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </div>
  );
}

export default Garantia;
