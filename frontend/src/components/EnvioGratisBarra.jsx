import { TIENDA, rellenar } from "../config/tienda";
import { clp, progresoEnvio } from "../lib/precios";

// umbral viene del backend (ENVIO_GRATIS_DESDE); con 0 no se muestra
function EnvioGratisBarra({ subtotal, umbral }) {
  const progreso = progresoEnvio(subtotal, umbral);
  if (!progreso) return null;
  const color = progreso.listo ? "#4caf50" : "#f5c800";
  return (
    <div role="status" style={{ marginBottom: 16 }}>
      <p
        style={{
          margin: "0 0 8px",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "0.8rem",
          fontWeight: 600,
          color: progreso.listo ? "#4caf50" : "#ccc",
        }}
      >
        <i className="bi bi-truck" aria-hidden="true" />{" "}
        {progreso.listo
          ? TIENDA.envioGratis.listo
          : rellenar(TIENDA.envioGratis.falta, { monto: clp(progreso.falta) })}
      </p>
      <div style={{ height: 6, background: "#222", borderRadius: 6, overflow: "hidden" }}>
        <div
          style={{
            width: `${progreso.pct}%`,
            height: "100%",
            background: color,
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </div>
  );
}

export default EnvioGratisBarra;
