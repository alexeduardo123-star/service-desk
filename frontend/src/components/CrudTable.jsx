import { useEffect, useState } from "react";
import Botao from "./Botao";
import InputField from "./InputField";
import { useNotification } from "../store/useNotification";

const vazio = (campos) => Object.fromEntries(campos.map((campo) => [campo.name, ""]));

export default function CrudTable({
  titulo,
  colunas,
  campos,
  service,
  podeEscrever = true,
  podeExcluir = true,
}) {
  const [registros, setRegistros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [form, setForm] = useState(null);
  const [editandoId, setEditandoId] = useState(null);
  const { notificar } = useNotification();

  async function carregar() {
    setCarregando(true);

    try {
      setRegistros(await service.listar());
    } catch {
      notificar("Erro ao carregar dados", "erro");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    // Agenda o carregamento para evitar setState síncrono no corpo do efeito.
    Promise.resolve().then(carregar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function abrirNovo() {
    setEditandoId(null);
    setForm(vazio(campos));
  }

  function abrirEdicao(registro) {
    setEditandoId(registro.id);
    setForm(
      Object.fromEntries(
        campos.map((campo) => {
          let valor = registro[campo.name] ?? "";

          if (campo.type === "date" && valor) {
            valor = String(valor).slice(0, 10);
          }

          return [campo.name, valor];
        })
      )
    );
  }

  function normalizar(dados) {
    const normalizado = { ...dados };

    for (const campo of campos) {
      if (campo.numeric) {
        normalizado[campo.name] =
          normalizado[campo.name] === ""
            ? null
            : Number(normalizado[campo.name]);
      }
    }

    return normalizado;
  }

  async function salvar(evento) {
    evento.preventDefault();

    try {
      const dados = normalizar(form);

      if (editandoId !== null) {
        await service.atualizar(editandoId, dados);
        notificar("Registro atualizado com sucesso");
      } else {
        await service.criar(dados);
        notificar("Registro criado com sucesso");
      }

      setForm(null);
      await carregar();
    } catch (err) {
      notificar(err.response?.data?.erro || "Erro ao salvar", "erro");
    }
  }

  async function excluir(id) {
    if (!confirm("Confirma a exclusão deste registro?")) return;

    try {
      await service.excluir(id);
      notificar("Registro excluído");
      await carregar();
    } catch (err) {
      notificar(err.response?.data?.erro || "Erro ao excluir", "erro");
    }
  }

  const mostrarAcoes = podeEscrever || podeExcluir;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-gray-900">{titulo}</h1>

        {podeEscrever && !form && (
          <Botao onClick={abrirNovo}>Novo</Botao>
        )}
      </div>

      {form && (
        <form
          onSubmit={salvar}
          className="mb-6 grid gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-2"
        >
          {campos.map((campo) => (
            <div key={campo.name}>
              {campo.type === "select" ? (
                <label className="flex flex-col gap-1 text-sm text-gray-700">
                  <span className="font-medium">{campo.label}</span>
                  <select
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                    required={campo.required}
                    value={form[campo.name]}
                    onChange={(evento) =>
                      setForm({
                        ...form,
                        [campo.name]: evento.target.value,
                      })
                    }
                  >
                    <option value="">Selecione…</option>
                    {campo.options.map((opcao) => (
                      <option key={opcao.value} value={opcao.value}>
                        {opcao.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <InputField
                  label={campo.label}
                  type={campo.type || "text"}
                  required={campo.required}
                  value={form[campo.name]}
                  onChange={(evento) =>
                    setForm({
                      ...form,
                      [campo.name]: evento.target.value,
                    })
                  }
                />
              )}
            </div>
          ))}

          <div className="sm:col-span-2 flex gap-2">
            <Botao type="submit">
              {editandoId !== null ? "Salvar alterações" : "Criar"}
            </Botao>

            <Botao
              type="button"
              variante="secundario"
              onClick={() => setForm(null)}
            >
              Cancelar
            </Botao>
          </div>
        </form>
      )}

      {carregando ? (
        <p className="text-sm text-gray-500">Carregando…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {colunas.map((coluna) => (
                  <th
                    key={coluna.key}
                    className="px-4 py-2 text-left font-medium text-gray-600"
                  >
                    {coluna.label}
                  </th>
                ))}

                {mostrarAcoes && <th className="px-4 py-2" />}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {registros.map((registro) => (
                <tr key={registro.id}>
                  {colunas.map((coluna) => (
                    <td
                      key={coluna.key}
                      className="px-4 py-2 text-gray-800"
                    >
                      {coluna.render
                        ? coluna.render(registro)
                        : String(registro[coluna.key] ?? "-")}
                    </td>
                  ))}

                  {mostrarAcoes && (
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      {podeEscrever && (
                        <button
                          type="button"
                          className="text-blue-600 hover:underline mr-3"
                          onClick={() => abrirEdicao(registro)}
                        >
                          Editar
                        </button>
                      )}

                      {podeExcluir && (
                        <button
                          type="button"
                          className="text-red-600 hover:underline"
                          onClick={() => excluir(registro.id)}
                        >
                          Excluir
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}

              {registros.length === 0 && (
                <tr>
                  <td
                    colSpan={colunas.length + (mostrarAcoes ? 1 : 0)}
                    className="px-4 py-6 text-center text-gray-400"
                  >
                    Nenhum registro encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}