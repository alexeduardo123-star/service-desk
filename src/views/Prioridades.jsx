import CrudTable from "../components/CrudTable";
import prioridadeService from "../services/prioridadeService";

const campos = [
  { name: "nome", label: "Nome", required: true },
  { name: "nivel", label: "Nível (1-4)", type: "number", required: true, numeric: true },
  { name: "slaHoras", label: "SLA (horas)", type: "number", required: true, numeric: true },
];

const colunas = [
  { key: "nome", label: "Nome" },
  { key: "nivel", label: "Nível" },
  { key: "slaHoras", label: "SLA (h)" },
];

export default function Prioridades() {
  return <CrudTable titulo="Prioridades" colunas={colunas} campos={campos} service={prioridadeService} />;
}
