import { useEffect, useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://faraelectronica-backend.onrender.com";

// el backend en render (plan free) se duerme a los ~15 min y tarda ~50s en despertar.
// lo despierto apenas carga la app y lo mantengo vivo mientras la pestaña siga abierta.
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
