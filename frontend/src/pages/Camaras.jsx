import CatalogoBase from "../components/CatalogoBase";

/**
 * Camaras — ahora es solo un wrapper de CatalogoBase.
 * Toda la logica (fetch, carrito, buscador, filtros, orden) vive ahi.
 */
function Camaras() {
  return (
    <CatalogoBase
      categoria="camaras"
      titulo={
        <>
          Cámaras de <span>Seguridad</span>
        </>
      }
      subtitulo="Vigilancia profesional para tu hogar y negocio"
    />
  );
}

export default Camaras;
