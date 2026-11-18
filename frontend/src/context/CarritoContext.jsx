import { createContext, useContext, useState, useEffect } from "react";
import { totalLinea } from "../lib/precios";
import { claveLinea } from "../lib/carrito";

const CarritoContext = createContext();

export function CarritoProvider({ children }) {
  // Cargar carrito guardado al iniciar (para que no se pierda al recargar)
  const [carrito, setCarrito] = useState(() => {
    try {
      const guardado = localStorage.getItem("carrito");
      return guardado ? JSON.parse(guardado) : [];
    } catch {
      return [];
    }
  });

  // Guardar el carrito cada vez que cambia
  useEffect(() => {
    localStorage.setItem("carrito", JSON.stringify(carrito));
  }, [carrito]);

  // opciones: { suscripcion, frecuencia_dias } -> va en una línea aparte de la compra única
  const agregarAlCarrito = (producto, cantidad = 1, opciones = {}) => {
    const suscripcion = !!opciones.suscripcion;
    const frecuencia_dias = suscripcion ? opciones.frecuencia_dias : null;
    const linea = suscripcion
      ? `${producto.id}-s${frecuencia_dias}`
      : String(producto.id);
    setCarrito((prev) => {
      const existe = prev.find((p) => claveLinea(p) === linea);
      if (existe)
        return prev.map((p) =>
          claveLinea(p) === linea
            ? { ...p, cantidad: p.cantidad + cantidad }
            : p,
        );
      return [
        ...prev,
        { ...producto, cantidad, linea, suscripcion, frecuencia_dias },
      ];
    });
  };

  // reciben la clave de la línea (para compras únicas es el id del producto)
  const quitarDelCarrito = (linea) =>
    setCarrito((prev) => prev.filter((p) => claveLinea(p) !== String(linea)));

  const cambiarCantidad = (linea, cantidad) => {
    if (cantidad < 1) return quitarDelCarrito(linea);
    setCarrito((prev) =>
      prev.map((p) =>
        claveLinea(p) === String(linea) ? { ...p, cantidad } : p,
      ),
    );
  };

  const vaciarCarrito = () => setCarrito([]);

  // combos y suscripción incluidos (el backend recalcula igual al pagar)
  const total = carrito.reduce((acc, p) => acc + totalLinea(p), 0);
  const cantidadTotal = carrito.reduce((acc, p) => acc + p.cantidad, 0);

  return (
    <CarritoContext.Provider
      value={{
        carrito,
        agregarAlCarrito,
        quitarDelCarrito,
        cambiarCantidad,
        vaciarCarrito,
        total,
        cantidadTotal,
      }}
    >
      {children}
    </CarritoContext.Provider>
  );
}

export function useCarrito() {
  return useContext(CarritoContext);
}
