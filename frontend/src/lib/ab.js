// A/B simple: la variante queda fija por navegador y ?ab_<experimento>=b la fuerza (QA).
const PREFIJO = "fara_ab_";

export function elegirVariante(
  experimento,
  variantes,
  { almacen = null, busqueda = "", aleatorio = Math.random } = {},
) {
  if (!variantes || variantes.length === 0) return null;

  const forzada = new URLSearchParams(busqueda).get(`ab_${experimento}`);
  if (forzada && variantes.includes(forzada)) return forzada;

  const clave = PREFIJO + experimento;
  let guardada = null;
  try {
    guardada = almacen ? almacen.getItem(clave) : null;
  } catch {
    guardada = null;
  }
  if (guardada && variantes.includes(guardada)) return guardada;

  const elegida =
    variantes[Math.floor(aleatorio() * variantes.length) % variantes.length];
  try {
    if (almacen) almacen.setItem(clave, elegida);
  } catch {
    // modo incógnito o storage lleno: igual devolvemos la variante
  }
  return elegida;
}

// variantes asignadas, para mandarlas como parámetros en los eventos del pixel
export function variantesGuardadas(experimentos, almacen) {
  const salida = {};
  for (const exp of experimentos) {
    try {
      const v = almacen ? almacen.getItem(PREFIJO + exp) : null;
      if (v) salida[`ab_${exp}`] = v;
    } catch {
      // sin storage no hay variantes que reportar
    }
  }
  return salida;
}
