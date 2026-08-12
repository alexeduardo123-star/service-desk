import CrudTable from "../components/CrudTable";
import categoriaService from "../services/categoriaService";

const campos = [
  { name: "nome", label: "Nome", required: true },
  { name: "descricao", label: "Descrição" },
];

const colunas = [
  { key: "nome", label: "Nome" },
  { key: "descricao", label: "Descrição" },
];

export default function Categorias() {
  return <CrudTable titulo="Categorias" colunas={colunas} campos={campos} service={categoriaService} />;
}
