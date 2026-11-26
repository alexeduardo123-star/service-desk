import { useEffect, useState } from "react";
import CrudTable from "../components/CrudTable";
import SituacaoBadge from "../components/SituacaoBadge";
import assuntoService from "../services/assuntoService";
import servicoService from "../services/servicoService";
import formularioService from "../services/formularioService";
import prioridadeService from "../services/prioridadeService";

// Itens inativos continuam na lista (para não "sumir" na edição), mas sinalizados.
const opcao = (item) => ({
  value: item.id,
  label: item.ativo ? item.nome : `${item.nome} (inativo)`,
});

export default function Assuntos() {
  const [servicos, setServicos] = useState([]);
  const [formularios, setFormularios] = useState([]);
  const [prioridades, setPrioridades] = useState([]);
  const [erroRelacionamentos, setErroRelacionamentos] = useState("");

  useEffect(() => {
    let ativo = true;

    async function carregarRelacionamentos() {
      try {
        const [listaServicos, listaFormularios, listaPrioridades] = await Promise.all([
          servicoService.listar(),
          formularioService.listar(),
          prioridadeService.listar(),
        ]);

        if (!ativo) return;

        setServicos(listaServicos);
        setFormularios(listaFormularios);
        setPrioridades(listaPrioridades);
        setErroRelacionamentos("");
      } catch {
        if (ativo) {
          setErroRelacionamentos(
            "Não foi possível carregar serviços, formulários e prioridades. Atualize a página e tente novamente."
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
    { name: "nome", label: "Nome do assunto", required: true },
    {
      name: "servicoId",
      label: "Serviço",
      type: "select",
      numeric: true,
      required: true,
      options: servicos.map(opcao),
    },
    {
      name: "prioridadeId",
      label: "Prioridade dos chamados",
      type: "select",
      numeric: true,
      required: true,
      options: prioridades.map((p) => ({ value: p.id, label: p.nome })),
    },
    {
      name: "formularioId",
      label: "Formulário",
      type: "select",
      numeric: true,
      placeholder: "Nenhum formulário",
      options: formularios.map(opcao),
    },
    { name: "descricao", label: "Descrição" },
    {
      name: "ativo",
      label: "Ativo",
      type: "checkbox",
      default: true,
      descricao: "Assuntos inativos não ficam disponíveis para novos chamados",
    },
  ];

  const colunas = [
    { key: "nome", label: "Assunto" },
    { key: "servico", label: "Serviço", render: (item) => item.servico?.nome || "-" },
    { key: "prioridade", label: "Prioridade", render: (item) => item.prioridade?.nome || "-" },
    { key: "formulario", label: "Formulário", render: (item) => item.formulario?.nome || "-" },
    { key: "ativo", label: "Situação", render: (item) => <SituacaoBadge ativo={item.ativo} /> },
  ];

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

      <CrudTable titulo="Assuntos" colunas={colunas} campos={campos} service={assuntoService} />
    </div>
  );
}
