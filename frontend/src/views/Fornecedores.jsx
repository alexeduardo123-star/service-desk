import CrudTable from "../components/CrudTable";
import SituacaoBadge from "../components/SituacaoBadge";
import fornecedorService from "../services/fornecedorService";
import { useAuth } from "../auth/useAuth";
import { temPermissao } from "../utils/permissoes";
import { formatarCnpj, formatarTelefone, validarFornecedor } from "../utils/fornecedor";

const campos = [
  { name: "nome", label: "Nome do fornecedor", required: true, maxLength: 120 },
  {
    name: "cnpj",
    label: "CNPJ",
    required: true,
    placeholder: "00.000.000/0000-00",
    inputMode: "numeric",
    formatar: formatarCnpj,
  },
  { name: "contato", label: "Contato", maxLength: 120 },
  {
    name: "telefone",
    label: "Telefone",
    placeholder: "(49) 99999-9999",
    inputMode: "tel",
    formatar: formatarTelefone,
  },
  { name: "email", label: "E-mail", type: "email", placeholder: "nome@empresa.com", maxLength: 120 },
  { name: "ativo", label: "Ativo", type: "checkbox", default: true, descricao: "Fornecedores inativos não aparecem ao cadastrar contratos" },
];

const colunas = [
  { key: "nome", label: "Fornecedor" },
  { key: "cnpj", label: "CNPJ", render: (item) => formatarCnpj(item.cnpj) },
  { key: "contato", label: "Contato", render: (item) => item.contato || "-" },
  { key: "telefone", label: "Telefone", render: (item) => (item.telefone ? formatarTelefone(item.telefone) : "-") },
  { key: "email", label: "E-mail", render: (item) => item.email || "-" },
  { key: "ativo", label: "Situação", render: (item) => <SituacaoBadge ativo={item.ativo} /> },
];

export default function Fornecedores() {
  const { usuario } = useAuth();

  return (
    <CrudTable
      titulo="Fornecedores"
      colunas={colunas}
      campos={campos}
      service={fornecedorService}
      validar={validarFornecedor}
      podeEscrever={temPermissao(usuario, "fornecedores.gerenciar")}
      podeExcluir={temPermissao(usuario, "fornecedores.gerenciar")}
    />
  );
}
