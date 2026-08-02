import "./TabelaSkeleton.css";

function TabelaSkeleton({ colunas = 4, linhas = 5 }) {
  return (
    <tbody aria-label="Carregando dados">
      {Array.from({ length: linhas }, (_, indice) => (
        <tr className="skeleton-row" key={indice}>
          {Array.from({ length: colunas }, (_, coluna) => (
            <td key={coluna}>
              <span className="skeleton-bloco" />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

export default TabelaSkeleton;
