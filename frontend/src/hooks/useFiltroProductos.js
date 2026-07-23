import { useMemo, useState } from "react";

/**
 * useFiltroProductos
 *
 * Añade búsqueda por texto y filtro por rango de precio sobre la lista de
 * productos que ya cargan Camaras.jsx / Calefaccion.jsx. Hoy esas páginas
 * solo tienen "ordenar"; esto agrega el buscador que falta para sentirse
 * una tienda completa.
 *
 * Colocar en: frontend/src/hooks/useFiltroProductos.js
 *
 * Uso dentro de una página de catálogo:
 *
 *   const {
 *     busqueda, setBusqueda,
 *     precioMax, setPrecioMax,
 *     orden, setOrden,
 *     productosFiltrados,
 *     precioTope,
 *   } = useFiltroProductos(productos);
 *
 *   <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar..." />
 *   ...mapear productosFiltrados igual que antes.
 */
export function useFiltroProductos(productos = []) {
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState("defecto");

  // Tope de precio disponible (para el slider de "precio máximo").
  const precioTope = useMemo(() => {
    if (!productos.length) return 0;
    return Math.max(...productos.map((p) => p.precio || 0));
  }, [productos]);

  const [precioMax, setPrecioMax] = useState(null); // null = sin límite

  const productosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    let lista = productos.filter((p) => {
      const coincideTexto =
        !texto ||
        p.nombre?.toLowerCase().includes(texto) ||
        p.descripcion?.toLowerCase().includes(texto);
      const dentroDePrecio = precioMax == null || (p.precio || 0) <= precioMax;
      return coincideTexto && dentroDePrecio;
    });

    lista = [...lista].sort((a, b) => {
      if (orden === "precio_asc") return (a.precio || 0) - (b.precio || 0);
      if (orden === "precio_desc") return (b.precio || 0) - (a.precio || 0);
      if (orden === "nombre_asc") return a.nombre.localeCompare(b.nombre);
      // "Recomendados": disponibles primero, luego por defecto.
      if (orden === "defecto") return (a.agotado ? 1 : 0) - (b.agotado ? 1 : 0);
      return 0;
    });

    return lista;
  }, [productos, busqueda, precioMax, orden]);

  return {
    busqueda,
    setBusqueda,
    precioMax,
    setPrecioMax,
    precioTope,
    orden,
    setOrden,
    productosFiltrados,
  };
}

export default useFiltroProductos;
