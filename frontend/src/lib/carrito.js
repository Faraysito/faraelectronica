// clave de una línea del carrito: el mismo producto puede ir como compra única y como suscripción
export function claveLinea(linea) {
  return linea.linea ?? String(linea.id);
}
