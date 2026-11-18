import test from "node:test";
import assert from "node:assert/strict";
import { elegirVariante } from "./ab.js";

function almacenFalso() {
  const datos = {};
  return {
    getItem: (k) => (k in datos ? datos[k] : null),
    setItem: (k, v) => {
      datos[k] = String(v);
    },
  };
}

test("A/B: la variante queda fija por navegador y ?ab_ la fuerza sin guardarla", () => {
  const almacen = almacenFalso();
  const primera = elegirVariante("titular", ["a", "b"], { almacen, aleatorio: () => 0.9 });
  assert.equal(primera, "b");
  // otra visita con otro random: se mantiene la guardada
  assert.equal(elegirVariante("titular", ["a", "b"], { almacen, aleatorio: () => 0 }), "b");
  // QA: forzar por URL
  assert.equal(elegirVariante("titular", ["a", "b"], { almacen, busqueda: "?ab_titular=a" }), "a");
  assert.equal(almacen.getItem("fara_ab_titular"), "b");
  // variante inválida en la URL se ignora
  assert.equal(elegirVariante("titular", ["a", "b"], { almacen, busqueda: "?ab_titular=z" }), "b");
});
