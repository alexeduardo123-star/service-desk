import { useEffect, useState } from "react";

// Devolve `valor` só depois que ele fica `atraso` ms sem mudar. Usado nas buscas
// enquanto a pessoa digita, para não chamar a API a cada tecla.
export function useDebounce(valor, atraso = 300) {
  const [atrasado, setAtrasado] = useState(valor);

  useEffect(() => {
    const id = setTimeout(() => setAtrasado(valor), atraso);
    return () => clearTimeout(id);
  }, [valor, atraso]);

  return atrasado;
}
