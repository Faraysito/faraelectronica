import { TIENDA } from "../../config/tienda";

function celda(valor) {
  if (valor === true) return <i className="bi bi-check-circle-fill ok" aria-label="Sí" />;
  if (valor === false) return <i className="bi bi-x-circle no" aria-label="No" />;
  return <span className="tc-txt">{valor}</span>;
}

function TablaComparativa() {
  const { titulo, columnas, filas } = TIENDA.comparativa;
  return (
    <section className="pdp-seccion" aria-labelledby="titulo-comparativa">
      <h2 id="titulo-comparativa">{titulo}</h2>
      <div className="tc-wrap">
        <table className="tc">
          <thead>
            <tr>
              <th scope="col" />
              <th scope="col" className="nosotros">
                {columnas[0]}
              </th>
              <th scope="col">{columnas[1]}</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.texto}>
                <th scope="row">{f.texto}</th>
                <td className="nosotros">{celda(f.nosotros)}</td>
                <td>{celda(f.otros)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default TablaComparativa;
