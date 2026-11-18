// Klaviyo Client API (solo public key / site id: es seguro usarla en el navegador)
export const KLAVIYO_REVISION = "2026-07-15";

const PUBLIC_KEY = import.meta.env.VITE_KLAVIYO_PUBLIC_KEY;
const LIST_ID = import.meta.env.VITE_KLAVIYO_LIST_ID;

export const klaviyoActivo = () => Boolean(PUBLIC_KEY && LIST_ID);

export async function suscribirEmail(email, fuente = "Popup web") {
  const res = await fetch(
    `https://a.klaviyo.com/client/subscriptions?company_id=${encodeURIComponent(PUBLIC_KEY)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/vnd.api+json",
        Accept: "application/vnd.api+json",
        revision: KLAVIYO_REVISION,
      },
      body: JSON.stringify({
        data: {
          type: "subscription",
          attributes: {
            custom_source: fuente,
            profile: {
              data: {
                type: "profile",
                attributes: {
                  email,
                  subscriptions: { email: { marketing: { consent: "SUBSCRIBED" } } },
                },
              },
            },
          },
          relationships: { list: { data: { type: "list", id: LIST_ID } } },
        },
      }),
    },
  );
  if (!res.ok) throw new Error("No pudimos suscribirte, intenta de nuevo.");
}
