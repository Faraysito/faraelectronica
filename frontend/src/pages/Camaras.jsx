import CatalogoBase from "../components/CatalogoBase";

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
