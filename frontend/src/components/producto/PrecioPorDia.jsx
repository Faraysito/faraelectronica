import { TIENDA, rellenar } from "../../config/tienda";
import { clp, precioPorDia } from "../../lib/precios";

function PrecioPorDia({ precio }) {
  const monto = precioPorDia(precio, TIENDA.precioPorDia.dias);
  if (!monto) return null;
  return (
    <p className="pdp-por-dia">
      <i className="bi bi-calendar-check" aria-hidden="true" />{" "}
      {rellenar(TIENDA.precioPorDia.texto, { monto: clp(monto) })}
    </p>
  );
}

export default PrecioPorDia;
