import { useEffect, useState } from "react";
import CrudTable from "../components/CrudTable";
import contratoService from "../services/contratoService";
import fornecedorService from "../services/fornecedorService";
import equipamentoService from "../services/equipamentoService";
import { useAuth } from "../auth/useAuth";
import { PapelUsuario } from "../enum/PapelUsuario";
import { formatDateOnly } from "../utils/formatDate";

export default function Contratos() {
  const [fornecedores, setFornecedores] = useState([]);
  const [equipamentos, setEquipamentos] = useState([]);
  const [erroRelacionamentos, setErroRelacionamentos] = useState("");
  const { usuario } = useAuth();

  useEffect(() => {
    let ativo = true;

    async function carregarRelacionamentos() {
      try {
        const [listaFornecedores, listaEquipamentos] = await Promise.all([
          fornecedorService.listar(),
          equipamentoService.listar(),
        ]);

        if (!ativo) return;

        setFornecedores(listaFornecedores.filter((item) => item.ativo));
        setEquipamentos(listaEquipamentos);
        setErroRelacionamentos("");
      } catch {
        if (ativo) {
          setErroRelacionamentos(
            "Não foi possível carregar fornecedores e equipamentos. Atualize a página e tente novamente."
          );
        }
      }
    }

    carregarRelacionamentos();

    return () => {
      ativo = false;
    };
  }, []);

  const campos = [
    {
      name: "titulo",
      label: "Título do contrato",
      required: true,
    },
    {
      name: "fornecedorId",
      label: "Fornecedor",
      type: "select",
      numeric: true,
      required: true,
      options: fornecedores.map((item) => ({
        value: item.id,
        label: item.nome,
      })),
    },
    {
      name: "equipamentoId",
      label: "Equipamento",
      type: "select",
      numeric: true,
      required: true,
      options: equipamentos.map((item) => ({
        value: item.id,
        label: `${item.nome} (${item.numeroSerie})`,
      })),
    },
    {
      name: "inicio",
      label: "Início da vigência",
      type: "date",
      required: true,
    },
    {
      name: "fim",
      label: "Fim da vigência",
      type: "date",
      required: true,
    },
    {
      name: "valor",
      label: "Valor (R$)",
      type: "number",
      required: true,
    },
    {
      name: "status",
      label: "Situação",
      type: "select",
      required: true,
      options: [
        { value: "ATIVO", label: "Ativo" },
        { value: "SUSPENSO", label: "Suspenso" },
        { value: "ENCERRADO", label: "Encerrado" },
      ],
    },
    {
      name: "observacoes",
      label: "Observações",
    },
  ];

  const colunas = [
    { key: "titulo", label: "Contrato" },
    {
      key: "fornecedor",
      label: "Fornecedor",
      render: (item) => item.fornecedor?.nome || "-",
    },
    {
      key: "equipamento",
      label: "Equipamento",
      render: (item) => item.equipamento?.nome || "-",
    },
    {
      key: "inicio",
      label: "Início",
      render: (item) => formatDateOnly(item.inicio),
    },
    {
      key: "fim",
      label: "Fim",
      render: (item) => formatDateOnly(item.fim),
    },
    { key: "status", label: "Situação" },
  ];

  const podeEscrever =
    usuario?.papel === PapelUsuario.ADMIN ||
    usuario?.papel === PapelUsuario.TECNICO;

  const podeExcluir = usuario?.papel === PapelUsuario.ADMIN;

  return (
    <div>
      {erroRelacionamentos && (
        <p
          role="alert"
          className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {erroRelacionamentos}
        </p>
      )}

      <CrudTable
        titulo="Contratos de manutenção"
        colunas={colunas}
        campos={campos}
        service={contratoService}
        podeEscrever={podeEscrever}
        podeExcluir={podeExcluir}
      />
    </div>
  );
}