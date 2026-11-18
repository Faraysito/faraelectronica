import { ahorroPct, clp, precioUnitario } from "../../lib/precios";

const CANTIDADES = [1, 2, 3];

// combos x1 x2 x3: los precios salen de los tramos que manda el backend
function Combos({ producto, cantidad, onChange, suscripcion, pctSuscripcion }) {
  const opciones = CANTIDADES.map((n) => {
    const unitario = precioUnitario(producto, n, { suscripcion, pctSuscripcion });
    return {
      n,
      unitario,
      total: unitario * n,
      ahorro: ahorroPct(producto.precio, unitario),
      disponible: (producto.stock || 0) >= n,
    };
  });
  const mejorAhorro = Math.max(0, ...opciones.filter((o) => o.disponible).map((o) => o.ahorro));

  return (
    <div className="combos" role="radiogroup" aria-label="Elige la cantidad">
      {opciones.map((o) => (
        <button
          type="button"
          role="radio"
          aria-checked={cantidad === o.n}
          key={o.n}
          disabled={!o.disponible}
          className={`combo${cantidad === o.n ? " activo" : ""}`}
          onClick={() => onChange(o.n)}
        >
          {o.disponible && o.ahorro > 0 && o.ahorro === mejorAhorro && (
            <span className="combo-tag">Mejor precio</span>
          )}
          <span className="combo-n">x{o.n}</span>
          <span className="combo-txt">{o.n === 1 ? "1 unidad" : `${o.n} unidades`}</span>
          <span className="combo-total">{clp(o.total)}</span>
          {o.n > 1 && <span className="combo-unit">{clp(o.unitario)} c/u</span>}
          {o.ahorro > 0 && <span className="combo-ahorro">Ahorras {o.ahorro}%</span>}
          {!o.disponible && <span className="combo-unit">Sin stock suficiente</span>}
        </button>
      ))}
    </div>
  );
}

export default Combos;
