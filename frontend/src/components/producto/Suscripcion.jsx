import { clp } from "../../lib/precios";

// "Suscríbete y ahorra": sin cobro automático, el backend registra la suscripción al pagar
function Suscripcion({
  activa,
  onChange,
  pct,
  frecuencias,
  frecuencia,
  onFrecuencia,
  precioUnica,
  precioSuscripcion,
}) {
  return (
    <div className="sus" role="radiogroup" aria-label="Tipo de compra">
      <label className={`sus-op${!activa ? " activo" : ""}`}>
        <input
          type="radio"
          name="tipo-compra"
          checked={!activa}
          onChange={() => onChange(false)}
        />
        <span className="sus-titulo">Compra única</span>
        <span className="sus-precio">{clp(precioUnica)}</span>
      </label>
      <label className={`sus-op${activa ? " activo" : ""}`}>
        <input
          type="radio"
          name="tipo-compra"
          checked={activa}
          onChange={() => onChange(true)}
        />
        <span className="sus-titulo">Suscríbete y ahorra {pct}%</span>
        <span className="sus-precio">{clp(precioSuscripcion)}</span>
        {activa && (
          <span className="sus-detalle">
            Recíbelo cada
            <select
              value={frecuencia}
              onChange={(e) => onFrecuencia(Number(e.target.value))}
              aria-label="Frecuencia de la suscripción"
            >
              {frecuencias.map((f) => (
                <option key={f} value={f}>
                  {f} días
                </option>
              ))}
            </select>
            <small>
              Sin cobros automáticos: te recordamos por correo cuando toca y cancelas cuando quieras.
            </small>
          </span>
        )}
      </label>
    </div>
  );
}

export default Suscripcion;
