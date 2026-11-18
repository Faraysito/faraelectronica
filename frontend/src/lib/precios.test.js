import test from "node:test";
import assert from "node:assert/strict";
import {
  precioUnitario,
  totalLinea,
  precioPorDia,
  progresoEnvio,
} from "./precios.js";

const camara = {
  id: 1,
  precio: 25000,
  tramos: [
    { min: 2, max: 3, precio_unitario: 22000 },
    { min: 5, max: null, precio_unitario: 20000 },
  ],
};

test("sin tramos el unitario es el precio base", () => {
  assert.equal(precioUnitario({ precio: 25000 }, 3), 25000);
  assert.equal(precioUnitario({ precio: 25000, tramos: [] }, 1), 25000);
});

test("combos: usa el tramo que aplica y respeta el máximo (igual que el backend)", () => {
  assert.equal(precioUnitario(camara, 1), 25000);
  assert.equal(precioUnitario(camara, 2), 22000);
  assert.equal(precioUnitario(camara, 3), 22000);
  assert.equal(precioUnitario(camara, 4), 25000);
  assert.equal(precioUnitario(camara, 7), 20000);
});

test("suscripción descuenta el % con piso sobre el precio del combo", () => {
  assert.equal(precioUnitario(camara, 2, { suscripcion: true, pctSuscripcion: 10 }), 19800);
  assert.equal(precioUnitario({ precio: 9999 }, 1, { suscripcion: true, pctSuscripcion: 15 }), 8499);
  assert.equal(precioUnitario(camara, 1, { suscripcion: true, pctSuscripcion: 0 }), 25000);
  assert.equal(totalLinea({ ...camara, cantidad: 2, suscripcion: true, pct_suscripcion: 10 }), 39600);
});

test("precio por día redondea hacia arriba", () => {
  assert.equal(precioPorDia(36500), 100);
  assert.equal(precioPorDia(36501), 101);
  assert.equal(precioPorDia(0), 0);
});

test("barra de envío gratis: falta, listo y apagada", () => {
  assert.deepEqual(progresoEnvio(30000, 50000), { falta: 20000, listo: false, pct: 60 });
  assert.deepEqual(progresoEnvio(60000, 50000), { falta: 0, listo: true, pct: 100 });
  assert.equal(progresoEnvio(10000, 0), null);
});
