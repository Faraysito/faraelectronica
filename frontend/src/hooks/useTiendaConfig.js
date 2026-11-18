import { useEffect, useState } from "react";
import { API_URL } from "../lib/api";

// mientras carga (o si el backend no responde) todo lo que depende del backend queda apagado
const POR_DEFECTO = {
  moneda: "CLP",
  suscripcion: { descuento_pct: 0, frecuencias_dias: [] },
  envio: { gratis_desde: 0 },
};

let cache = null;
let pedido = null;

export function cargarTiendaConfig() {
  if (cache) return Promise.resolve(cache);
  if (!pedido) {
    pedido = fetch(`${API_URL}/api/tienda/config/`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("config"))))
      .then((c) => {
        cache = { ...POR_DEFECTO, ...c };
        return cache;
      })
      .catch(() => {
        pedido = null;
        return POR_DEFECTO;
      });
  }
  return pedido;
}

export function useTiendaConfig() {
  const [config, setConfig] = useState(() => cache || POR_DEFECTO);

  useEffect(() => {
    if (cache) return;
    let activo = true;
    cargarTiendaConfig().then((c) => {
      if (activo) setConfig(c);
    });
    return () => {
      activo = false;
    };
  }, []);

  return config;
}
