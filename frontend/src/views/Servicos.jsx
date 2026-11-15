import CrudTable from "../components/CrudTable";
import SituacaoBadge from "../components/SituacaoBadge";
import servicoService from "../services/servicoService";

const campos = [
  { name: "nome", label: "Nome", required: true },
  { name: "descricao", label: "Descrição" },
  {
    name: "ativo",
    label: "Ativo",
    type: "checkbox",
    default: true,
    descricao: "Serviços inativos não ficam disponíveis para novos chamados",
  },
];

const colunas = [
  { key: "nome", label: "Serviço" },
  { key: "descricao", label: "Descrição" },
  { key: "assuntos", label: "Assuntos", render: (item) => item._count?.assuntos ?? 0 },
  { key: "ativo", label: "Situação", render: (item) => <SituacaoBadge ativo={item.ativo} /> },
];

export default function Servicos() {
  return <CrudTable titulo="Serviços" colunas={colunas} campos={campos} service={servicoService} />;
}
