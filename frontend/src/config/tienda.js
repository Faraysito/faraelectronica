// Editables para test: copys, toggles y variantes A/B de la tienda.
// OJO: precios, % de combos/suscripción y umbral de envío gratis NO van acá,
// los define el backend (.env) para que lo que se muestra sea lo que se cobra.
// Antes de publicar un claim, revisa que sea verdad para tus productos.

export const TIENDA = {
  // apagar/prender cada bloque sin tocar componentes
  secciones: {
    titular: true,
    resenas: true,
    combos: true,
    suscripcion: true,
    precioPorDia: true,
    garantia: true,
    especificaciones: true,
    sellos: true,
    ugc: true,
    comparativa: true,
    timeline: true,
    faq: true,
    disclaimer: true,
    barraFija: true,
    envioGratis: true,
    upsell: true,
    pagoExpress: true,
    popupEmail: true,
  },

  // experimentos A/B: la variante queda fija por navegador; ?ab_titular=b la fuerza
  ab: {
    titular: ["a", "b"],
    cta: ["a", "b"],
  },

  // titular con el resultado (el campo "titular" del producto en el admin tiene prioridad)
  titulares: {
    camaras: {
      a: "Más tranquilidad para tu casa o negocio",
      b: "Protege lo que más te importa",
    },
    calefaccion: {
      a: "Más calor en tu hogar este invierno",
      b: "Temperatura agradable en cada espacio",
    },
    default: {
      a: "Tecnología de calidad para tu día a día",
      b: "Elige bien a la primera",
    },
  },

  cta: {
    a: "Comprar ahora",
    b: "Lo quiero",
  },

  precioPorDia: {
    dias: 365,
    texto: "Equivale a {monto} al día durante un año",
  },

  garantia: {
    titulo: "Compra protegida",
    puntos: [
      "Garantía legal de 6 meses: cambio, reparación o devolución si el producto falla (Ley del Consumidor).",
      "Derecho a retracto: 10 días desde que lo recibes para arrepentirte de tu compra online.",
      "Hablas directo con el vendedor por WhatsApp ante cualquier problema.",
    ],
  },

  // solo cosas verificables de la tienda (las certificaciones del producto salen del admin)
  sellos: [
    { icono: "bi-shield-lock", texto: "Pago seguro con Webpay" },
    { icono: "bi-patch-check", texto: "Garantía legal 6 meses" },
    { icono: "bi-whatsapp", texto: "Atención directa por WhatsApp" },
    { icono: "bi-box-seam", texto: "Stock real actualizado" },
  ],

  comparativa: {
    titulo: "¿Por qué comprar en Fara?",
    columnas: ["Fara Electrónica", "Compra genérica"],
    filas: [
      { texto: "Hablas directo con el vendedor", nosotros: true, otros: "A veces" },
      { texto: "Pago con Webpay (débito y crédito)", nosotros: true, otros: "Varía" },
      { texto: "Stock real: si aparece disponible, hay", nosotros: true, otros: "Varía" },
      { texto: "Precio final recalculado al pagar, sin sorpresas", nosotros: true, otros: "Varía" },
      { texto: "Garantía legal de 6 meses", nosotros: true, otros: true },
    ],
  },

  // qué pasa después de comprar (tiempos estimados, ajústalos a tu operación)
  timeline: {
    titulo: "Qué pasa después de comprar",
    pasos: {
      default: [
        { cuando: "Hoy", titulo: "Pagas con Webpay", texto: "Tu orden queda confirmada al instante y la ves en \"Mis compras\"." },
        { cuando: "Después de pagar", titulo: "Coordinamos la entrega", texto: "Te escribimos por WhatsApp para coordinar el despacho o retiro." },
        { cuando: "Al recibirlo", titulo: "Lo instalas y usas", texto: "Sigue el modo de uso de esta página; si tienes dudas te ayudamos." },
        { cuando: "6 meses", titulo: "Garantía legal", texto: "Si falla, tienes cambio, reparación o devolución." },
      ],
      camaras: [
        { cuando: "Hoy", titulo: "Pagas con Webpay", texto: "Tu orden queda confirmada al instante y la ves en \"Mis compras\"." },
        { cuando: "Después de pagar", titulo: "Coordinamos la entrega", texto: "Te escribimos por WhatsApp para coordinar el despacho o retiro." },
        { cuando: "Al recibirla", titulo: "La instalas", texto: "Sigue el modo de uso de esta página; si tienes dudas te ayudamos." },
        { cuando: "Desde ese día", titulo: "Vigilas tu espacio", texto: "Revisas lo que pasa en tu casa o negocio según las funciones del modelo." },
      ],
      calefaccion: [
        { cuando: "Hoy", titulo: "Pagas con Webpay", texto: "Tu orden queda confirmada al instante y la ves en \"Mis compras\"." },
        { cuando: "Después de pagar", titulo: "Coordinamos la entrega", texto: "Te escribimos por WhatsApp para coordinar el despacho o retiro." },
        { cuando: "Al recibirlo", titulo: "Lo enciendes", texto: "Sigue el modo de uso y las indicaciones de seguridad del fabricante." },
        { cuando: "Desde el primer uso", titulo: "Ambiente temperado", texto: "Calor en el espacio para el que está pensado el equipo." },
      ],
    },
  },

  // {pct} y {umbral} se reemplazan con lo que manda el backend
  faq: {
    titulo: "Preguntas frecuentes",
    general: [
      { p: "¿Cómo puedo pagar?", r: "Con Webpay (débito, crédito o prepago) o coordinando directo con el vendedor por WhatsApp." },
      { p: "¿Cómo recibo mi compra?", r: "Después de pagar te contactamos por WhatsApp para coordinar el despacho o retiro." },
      { p: "¿Hay envío gratis?", r: "Sí, en compras desde {umbral}. El carrito te muestra cuánto te falta.", si: "envioGratis" },
      { p: "¿Qué garantía tiene?", r: "Garantía legal de 6 meses: si falla puedes elegir cambio, reparación o devolución del dinero." },
      { p: "¿Puedo devolverlo si me arrepiento?", r: "Sí, tienes derecho a retracto de 10 días desde que recibes el producto, en compras online." },
      { p: "¿Cómo funciona la suscripción?", r: "Eliges cada cuántos días lo quieres y cada pedido te sale {pct}% más barato. No guardamos tu tarjeta ni hay cobros automáticos: te recordamos por correo cuando toca y la cancelas cuando quieras desde \"Mis compras\".", si: "suscripcion" },
      { p: "¿Las reseñas son reales?", r: "Sí. Solo pueden opinar clientes con una compra pagada del producto." },
    ],
    camaras: [
      { p: "¿Necesito instalación profesional?", r: "Depende del modelo. Revisa \"Modo de uso\" en esta página o escríbenos por WhatsApp y te orientamos." },
    ],
    calefaccion: [
      { p: "¿Para qué tamaño de espacio sirve?", r: "Revisa las especificaciones del equipo; si tienes dudas sobre tu espacio, escríbenos por WhatsApp." },
    ],
  },

  disclaimer: [
    "Las imágenes son referenciales.",
    "El precio por día es una referencia: precio ÷ 365 días.",
    "Los plazos de \"Qué pasa después de comprar\" son estimados.",
    "Las reseñas son de clientes con compra verificada; solo moderamos spam u ofensas.",
    "Precio y stock se confirman al momento de pagar.",
  ],

  envioGratis: {
    falta: "Te faltan {monto} para envío gratis",
    listo: "¡Tu pedido tiene envío gratis!",
  },

  upsell: {
    titulo: "Complementa tu compra",
  },

  popupEmail: {
    titulo: "¿Te avisamos de las ofertas?",
    texto: "Déjanos tu correo y entérate primero de ofertas y productos nuevos.",
    boton: "Quiero enterarme",
    legal: "Al suscribirte aceptas recibir correos de Fara Electrónica. Puedes darte de baja cuando quieras.",
    gracias: "¡Listo! Revisa tu correo.",
    segundos: 20, // se abre a los X segundos o al intentar salir (desktop)
    diasEntreAperturas: 7,
  },
};

export function titularPara(categoria, variante) {
  const textos = TIENDA.titulares[categoria] || TIENDA.titulares.default;
  return textos[variante] || textos.a;
}

export function rellenar(texto, valores) {
  return texto.replace(/\{(\w+)\}/g, (todo, clave) =>
    valores[clave] != null ? String(valores[clave]) : todo,
  );
}
