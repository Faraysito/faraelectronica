import { TIENDA } from "../../config/tienda";

function Disclaimer() {
  return (
    <section className="pdp-disclaimer" aria-label="Aclaraciones">
      <ul>
        {TIENDA.disclaimer.map((d) => (
          <li key={d}>{d}</li>
        ))}
      </ul>
    </section>
  );
}

export default Disclaimer;
