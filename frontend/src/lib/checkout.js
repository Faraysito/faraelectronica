// Pago con Webpay compartido por el carrito, el modal de compra y el "Comprar ahora".
import { API_URL } from "./api";
import { cookiesMeta, track } from "./metaPixel";

export const hayUsuario = () => !!localStorage.getItem("user");

export function itemsParaPago(lineas) {
  return lineas.map((l) => ({
    id: l.id,
    cantidad: l.cantidad,
    ...(l.suscripcion
      ? { suscripcion: true, frecuencia_dias: l.frecuencia_dias }
      : {}),
  }));
}

// crea la orden en el backend (que recalcula precios) y manda al cliente a Webpay
export async function pagarConWebpay(lineas) {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("Debes iniciar sesión para pagar.");

  let res;
  try {
    res = await fetch(`${API_URL}/api/webpay/crear/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ items: itemsParaPago(lineas) }),
    });
  } catch {
    throw new Error("Error de conexión con el servidor.");
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    throw new Error("Tu sesión expiró, vuelve a iniciar sesión.");
  }
  if (!res.ok) throw new Error(data.error || "No se pudo iniciar el pago.");

  const salio = track("InitiateCheckout", {
    currency: "CLP",
    value: data.total,
    num_items: lineas.reduce((acc, l) => acc + l.cantidad, 0),
    content_ids: lineas.map((l) => String(l.id)),
    content_type: "product",
  });
  // le damos un momento al pixel antes de salir a Webpay
  if (salio) await new Promise((r) => setTimeout(r, 300));

  // Webpay funciona enviando un POST con el token a su URL.
  const form = document.createElement("form");
  form.method = "POST";
  form.action = data.url;
  const input = document.createElement("input");
  input.type = "hidden";
  input.name = "token_ws";
  input.value = data.token;
  form.appendChild(input);
  document.body.appendChild(form);
  form.submit();
}

export function datosConfirmacion(tokenWs) {
  return { token_ws: tokenWs, ...cookiesMeta() };
}
