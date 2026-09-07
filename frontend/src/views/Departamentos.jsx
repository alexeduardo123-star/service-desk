import CrudTable from "../components/CrudTable";
import departamentoService from "../services/departamentoService";

const campos = [
  { name: "nome", label: "Nome", required: true },
  { name: "descricao", label: "Descrição" },
];

const colunas = [
  { key: "nome", label: "Nome" },
  { key: "descricao", label: "Descrição" },
];

export default function Departamentos() {
  return <CrudTable titulo="Departamentos" colunas={colunas} campos={campos} service={departamentoService} />;
}
