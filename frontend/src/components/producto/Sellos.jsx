import { TIENDA } from "../../config/tienda";

// sellos de la tienda (config) + certificaciones reales del producto (admin)
function Sellos({ certificaciones = [] }) {
  const sellos = [
    ...TIENDA.sellos,
    ...certificaciones.map((c) => ({ icono: "bi-award", texto: c })),
  ];
  if (!sellos.length) return null;
  return (
    <ul className="pdp-sellos" aria-label="Sellos de calidad">
      {sellos.map((s) => (
        <li key={s.texto}>
          <i className={`bi ${s.icono}`} aria-hidden="true" /> {s.texto}
        </li>
      ))}
    </ul>
  );
}

export default Sellos;
