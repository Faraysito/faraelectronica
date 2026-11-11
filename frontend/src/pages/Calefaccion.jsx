import CatalogoBase from "../components/CatalogoBase";

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
