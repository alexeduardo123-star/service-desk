import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ticketService from "../services/ticketService";
import categoriaService from "../services/categoriaService";
import prioridadeService from "../services/prioridadeService";
import equipamentoService from "../services/equipamentoService";
import InputField from "../components/InputField";
import Botao from "../components/Botao";
import { useNotification } from "../store/NotificationContext";

export default function NovoTicket() {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [prioridadeId, setPrioridadeId] = useState("");
  const [equipamentoId, setEquipamentoId] = useState("");
  const [categorias, setCategorias] = useState([]);
  const [prioridades, setPrioridades] = useState([]);
  const [equipamentos, setEquipamentos] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const navigate = useNavigate();
  const { notificar } = useNotification();

  useEffect(() => {
    categoriaService.listar().then(setCategorias);
    prioridadeService.listar().then(setPrioridades);
    equipamentoService.listar().then(setEquipamentos);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      const ticket = await ticketService.criar({
        titulo,
        descricao,
        categoriaId: Number(categoriaId),
        prioridadeId: Number(prioridadeId),
        equipamentoId: equipamentoId ? Number(equipamentoId) : null,
      });
      notificar("Chamado aberto com sucesso");
      navigate(`/tickets/${ticket.id}`);
    } catch (err) {
      notificar(err.response?.data?.erro || "Erro ao abrir chamado", "erro");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Novo chamado</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6">
        <InputField label="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />

        <label className="flex flex-col gap-1 text-sm text-gray-700">
          <span className="font-medium">Descrição</span>
          <textarea
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            rows={4}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-gray-700">
          <span className="font-medium">Categoria</span>
          <select className="rounded-md border border-gray-300 px-3 py-2 text-sm" value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} required>
            <option value="">Selecione…</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-gray-700">
          <span className="font-medium">Prioridade</span>
          <select className="rounded-md border border-gray-300 px-3 py-2 text-sm" value={prioridadeId} onChange={(e) => setPrioridadeId(e.target.value)} required>
            <option value="">Selecione…</option>
            {prioridades.map((p) => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-gray-700">
          <span className="font-medium">Equipamento (opcional)</span>
          <select className="rounded-md border border-gray-300 px-3 py-2 text-sm" value={equipamentoId} onChange={(e) => setEquipamentoId(e.target.value)}>
            <option value="">Nenhum</option>
            {equipamentos.map((eq) => (
              <option key={eq.id} value={eq.id}>{eq.nome} ({eq.numeroSerie})</option>
            ))}
          </select>
        </label>

        <Botao type="submit" disabled={enviando}>{enviando ? "Enviando…" : "Abrir chamado"}</Botao>
      </form>
    </div>
  );
}
