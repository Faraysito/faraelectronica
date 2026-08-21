import CatalogoBase from "../components/CatalogoBase";

/**
 * Calefaccion — ahora es solo un wrapper de CatalogoBase.
 * Toda la logica (fetch, carrito, buscador, filtros, orden) vive ahi.
 */
function Calefaccion() {
  return (
    <CatalogoBase
      categoria="calefaccion"
      titulo={
        <>
          <span>Calefacción</span> Eficiente
        </>
      }
      subtitulo="Equipos de alta calidad para tu hogar"
    />
  );
}

export default Calefaccion;
