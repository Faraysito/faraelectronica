import { useEffect, useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://faraelectronica-backend.onrender.com";

/**
 * useKeepAlive
 *
 * El backend en Render (plan free) se duerme tras ~15 min de inactividad y
 * tarda ~50s en despertar. En una demo de portafolio eso se ve como si la
 * página estuviera rota. Este hook hace un "ping" apenas carga la app para
 * empezar a despertar el servidor cuanto antes, y expone el estado para que
 * la UI pueda avisar al usuario en vez de mostrar una pantalla vacía.
 *
 * Uso:
 *   const { despierto, despertando } = useKeepAlive();
 *
 * Devuelve:
 *   despierto    -> true cuando el backend respondió.
 *   despertando  -> true mientras se espera la primera respuesta.
 */
export function useKeepAlive() {
  const [despierto, setDespierto] = useState(false);
  const [despertando, setDespertando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    const controlador = new AbortController();

    // Pegamos a un endpoint barato (lista de productos) para forzar el arranque.
    fetch(`${API_URL}/api/productos/`, { signal: controlador.signal })
      .then(() => {
        if (cancelado) return;
        setDespierto(true);
        setDespertando(false);
      })
      .catch(() => {
        if (cancelado) return;
        // Aunque falle, dejamos de mostrar el aviso tras el timeout natural.
        setDespertando(false);
      });

    // Mantener vivo: re-ping cada 10 min mientras la pestaña esté abierta.
    const intervalo = setInterval(
      () => {
        fetch(`${API_URL}/api/productos/`).catch(() => {});
      },
      10 * 60 * 1000,
    );

    return () => {
      cancelado = true;
      controlador.abort();
      clearInterval(intervalo);
    };
  }, []);

  return { despierto, despertando };
}

export default useKeepAlive;
