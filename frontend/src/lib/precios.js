// Mismas reglas que backend/productos/precios.py (el que cobra es el backend).

export function aplicarPct(precio, pct) {
  return Math.floor((precio * (100 - pct)) / 100);
}

// tramo con mayor cantidad mínima que aplica a `cantidad`
export function tramoPara(tramos, cantidad) {
  let elegido = null;
  for (const t of tramos || []) {
    const aplica = t.min <= cantidad && (t.max == null || cantidad <= t.max);
    if (aplica && (!elegido || t.min > elegido.min)) elegido = t;
  }
  return elegido;
}

export function precioUnitario(
  producto,
  cantidad = 1,
  { suscripcion = false, pctSuscripcion = 0 } = {},
) {
  const tramo = tramoPara(producto?.tramos, cantidad);
  let unitario = tramo ? tramo.precio_unitario : Number(producto?.precio) || 0;
  if (suscripcion && pctSuscripcion > 0) {
    unitario = aplicarPct(unitario, pctSuscripcion);
  }
  return unitario;
}

// total de una línea del carrito (la línea guarda si es suscripción y el % mostrado)
export function totalLinea(linea) {
  const unitario = precioUnitario(linea, linea.cantidad, {
    suscripcion: !!linea.suscripcion,
    pctSuscripcion: linea.pct_suscripcion || 0,
  });
  return unitario * linea.cantidad;
}

export function ahorroPct(base, precio) {
  if (!base || precio >= base) return 0;
  return Math.round((1 - precio / base) * 100);
}

export function precioPorDia(precio, dias = 365) {
  if (!precio || !dias) return 0;
  return Math.ceil(precio / dias);
}

export function progresoEnvio(subtotal, umbral) {
  if (!umbral || umbral <= 0) return null;
  const falta = Math.max(0, umbral - subtotal);
  return {
    falta,
    listo: falta === 0,
    pct: Math.min(100, Math.round((subtotal / umbral) * 100)),
  };
}

export function clp(valor) {
  return "$" + (Number(valor) || 0).toLocaleString("es-CL");
}
