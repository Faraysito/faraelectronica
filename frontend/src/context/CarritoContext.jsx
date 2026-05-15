import { createContext, useContext, useState } from "react";

const CarritoContext = createContext();

export function CarritoProvider({ children }) {
  const [carrito, setCarrito] = useState([]);

  const agregarAlCarrito = (producto) => {
    setCarrito((prev) => {
      const existe = prev.find((p) => p.id === producto.id);
      if (existe)
        return prev.map((p) =>
          p.id === producto.id ? { ...p, cantidad: p.cantidad + 1 } : p,
        );
      return [...prev, { ...producto, cantidad: 1 }];
    });
  };

  const quitarDelCarrito = (id) =>
    setCarrito((prev) => prev.filter((p) => p.id !== id));

  const cambiarCantidad = (id, cantidad) => {
    if (cantidad < 1) return quitarDelCarrito(id);
    setCarrito((prev) =>
      prev.map((p) => (p.id === id ? { ...p, cantidad } : p)),
    );
  };

  const vaciarCarrito = () => setCarrito([]);

  const total = carrito.reduce(
    (acc, p) => acc + (p.precio || 0) * p.cantidad,
    0,
  );
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
