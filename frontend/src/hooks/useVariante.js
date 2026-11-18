import { useState } from "react";
import { elegirVariante } from "../lib/ab";
import { TIENDA } from "../config/tienda";

export function almacenSeguro() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

// variante A/B estable para este navegador (ver TIENDA.ab)
export function useVariante(experimento) {
  const [variante] = useState(() =>
    elegirVariante(experimento, TIENDA.ab[experimento] || [], {
      almacen: almacenSeguro(),
      busqueda: window.location.search,
    }),
  );
  return variante;
}
