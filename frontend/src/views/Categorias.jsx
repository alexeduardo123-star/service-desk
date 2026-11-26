import CrudTable from "../components/CrudTable";
import categoriaService from "../services/categoriaService";

const campos = [
  { name: "nome", label: "Nome", required: true },
  { name: "descricao", label: "Descrição" },
  {
    name: "exigeAprovacao",
    label: "Exige aprovação do gestor",
    type: "checkbox",
    default: false,
    descricao: "Chamados desta categoria só são atendidos depois que o gestor do setor aprovar",
  },
];

const colunas = [
  { key: "nome", label: "Nome" },
  { key: "descricao", label: "Descrição" },
  { key: "exigeAprovacao", label: "Aprovação", render: (item) => (item.exigeAprovacao ? "Exige gestor" : "-") },
];

export default function Categorias() {
  return <CrudTable titulo="Categorias" colunas={colunas} campos={campos} service={categoriaService} />;
}
