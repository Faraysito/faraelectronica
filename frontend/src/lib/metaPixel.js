// Meta Pixel (navegador). El Purchase también lo manda el backend por Conversions API
// con el mismo event_id (purchase-<orden>) para que Meta no lo cuente doble.
import { variantesGuardadas } from "./ab";
import { TIENDA } from "../config/tienda";

const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID;

export const pixelActivo = () => Boolean(PIXEL_ID) && typeof window !== "undefined";

export function initPixel() {
  if (!pixelActivo() || window.fbq) return;
  // snippet oficial de Meta, escrito en limpio
  const fbq = function (...args) {
    if (fbq.callMethod) fbq.callMethod.apply(fbq, args);
    else fbq.queue.push(args);
  };
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];
  window.fbq = fbq;
  if (!window._fbq) window._fbq = fbq;
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);
  window.fbq("init", PIXEL_ID);
}

function variantesAB() {
  try {
    return variantesGuardadas(Object.keys(TIENDA.ab), window.localStorage);
  } catch {
    return {};
  }
}

// devuelve true si el evento salió (sirve para esperar antes de irse a Webpay)
export function track(evento, params = {}, eventId) {
  if (!pixelActivo() || !window.fbq) return false;
  const datos = { ...params, ...variantesAB() };
  if (eventId) window.fbq("track", evento, datos, { eventID: eventId });
  else window.fbq("track", evento, datos);
  return true;
}

function leerCookie(nombre) {
  const m = document.cookie.match(new RegExp(`(?:^|; )${nombre}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : undefined;
}

// _fbp/_fbc los manda el front al backend para mejorar el match de la Conversions API
export function cookiesMeta() {
  return { fbp: leerCookie("_fbp"), fbc: leerCookie("_fbc") };
}

export function datosProducto(producto, cantidad = 1, valor) {
  return {
    content_ids: [String(producto.id)],
    content_name: producto.nombre,
    content_type: "product",
    contents: [{ id: String(producto.id), quantity: cantidad }],
    currency: "CLP",
    value: valor ?? (producto.precio || 0) * cantidad,
  };
}
