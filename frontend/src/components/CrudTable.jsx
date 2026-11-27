import { useEffect, useState } from "react";
import Botao from "./Botao";
import CabecalhoPagina from "./CabecalhoPagina";
import InputField from "./InputField";
import SelectField from "./SelectField";
import Toggle from "./Toggle";
import { Carregando, ErroCarregar } from "./Estados";
import { useNotification } from "../store/useNotification";

// Nome do registro para dar contexto aos botões da linha no leitor de tela
// ("Editar Suporte" em vez de vários "Editar" iguais).
function nomeDoRegistro(registro, colunas) {
  const valor = registro.nome ?? registro.titulo ?? registro[colunas[0]?.key];
  return typeof valor === "string" || typeof valor === "number" ? String(valor) : `registro ${registro.id}`;
}

const valorInicial = (campo) => campo.default ?? (campo.type === "checkbox" ? false : "");

const vazio = (campos) => Object.fromEntries(campos.map((campo) => [campo.name, valorInicial(campo)]));

export default function CrudTable({
  titulo,
  colunas,
  campos,
  service,
  podeEscrever = true,
  podeExcluir = true,
  // Validação opcional no front: recebe o formulário e devolve { campo: mensagem }.
  // Com ela, as mensagens aparecem embaixo de cada campo em vez do aviso do navegador.
  validar,
}) {
  const [registros, setRegistros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [falhou, setFalhou] = useState(false);
  const [form, setForm] = useState(null);
  const [editandoId, setEditandoId] = useState(null);
  const [erros, setErros] = useState({});
  const { notificar } = useNotification();

  async function carregar() {
    setCarregando(true);

    try {
      setRegistros(await service.listar());
      setFalhou(false);
    } catch {
      setFalhou(true);
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
    setErros({});
    setForm(vazio(campos));
  }

  function abrirEdicao(registro) {
    setEditandoId(registro.id);
    setErros({});
    setForm(
      Object.fromEntries(
        campos.map((campo) => {
          if (campo.type === "checkbox") {
            return [campo.name, Boolean(registro[campo.name])];
          }

          let valor = registro[campo.name] ?? "";

          if (campo.type === "date" && valor) {
            valor = String(valor).slice(0, 10);
          }

          return [campo.name, campo.formatar ? campo.formatar(valor) : valor];
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

    if (validar) {
      const encontrados = validar(form);
      if (Object.keys(encontrados).length > 0) {
        setErros(encontrados);
        notificar("Corrija os campos destacados", "erro");
        return;
      }
    }

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
      <CabecalhoPagina titulo={titulo}>
        {podeEscrever && !form && (
          <Botao type="button" onClick={abrirNovo}>Novo</Botao>
        )}
      </CabecalhoPagina>

      {form && (
        <form
          onSubmit={salvar}
          noValidate={Boolean(validar)}
          className="mb-6 grid gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-2"
        >
          {campos.map((campo) => (
            <div key={campo.name}>
              {campo.type === "checkbox" ? (
                <Toggle
                  label={campo.label}
                  descricao={campo.descricao}
                  checked={Boolean(form[campo.name])}
                  onChange={(valor) =>
                    setForm({
                      ...form,
                      [campo.name]: valor,
                    })
                  }
                />
              ) : campo.type === "select" ? (
                <SelectField
                  label={campo.label}
                  required={campo.required}
                  value={form[campo.name]}
                  error={erros[campo.name]}
                  placeholder={campo.placeholder ?? "Selecione…"}
                  options={campo.options}
                  onChange={(evento) => {
                    setForm({ ...form, [campo.name]: evento.target.value });
                    if (erros[campo.name]) setErros({ ...erros, [campo.name]: undefined });
                  }}
                />
              ) : (
                <InputField
                  label={campo.label}
                  type={campo.type || "text"}
                  required={campo.required}
                  value={form[campo.name]}
                  error={erros[campo.name]}
                  placeholder={campo.placeholder}
                  maxLength={campo.maxLength}
                  inputMode={campo.inputMode}
                  onChange={(evento) => {
                    const valor = campo.formatar ? campo.formatar(evento.target.value) : evento.target.value;
                    setForm({ ...form, [campo.name]: valor });
                    if (erros[campo.name]) setErros({ ...erros, [campo.name]: undefined });
                  }}
                />
              )}
            </div>
          ))}

          <div className="flex flex-wrap gap-2 sm:col-span-2">
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
        <Carregando />
      ) : falhou ? (
        <ErroCarregar texto="Não foi possível carregar os registros." onTentarDeNovo={carregar} />
      ) : (
        // Abaixo de ~640 px a tabela rola na horizontal dentro da caixa, sem
        // empurrar a página; o foco pelo teclado permite rolar com as setas.
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white" tabIndex={0} role="region" aria-label={titulo}>
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {colunas.map((coluna) => (
                  <th
                    key={coluna.key}
                    scope="col"
                    className="whitespace-nowrap px-4 py-2 text-left font-medium text-gray-700"
                  >
                    {coluna.label}
                  </th>
                ))}

                {mostrarAcoes && (
                  <th scope="col" className="px-4 py-2">
                    <span className="sr-only">Ações</span>
                  </th>
                )}
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
                    <td className="whitespace-nowrap px-4 py-2 text-right">
                      {podeEscrever && (
                        <Botao type="button" variante="link" className="mr-3" aria-label={`Editar ${nomeDoRegistro(registro, colunas)}`} onClick={() => abrirEdicao(registro)}>
                          Editar
                        </Botao>
                      )}

                      {podeExcluir && (
                        <Botao type="button" variante="linkPerigo" aria-label={`Excluir ${nomeDoRegistro(registro, colunas)}`} onClick={() => excluir(registro.id)}>
                          Excluir
                        </Botao>
                      )}
                    </td>
                  )}
                </tr>
              ))}

              {registros.length === 0 && (
                <tr>
                  <td
                    colSpan={colunas.length + (mostrarAcoes ? 1 : 0)}
                    className="px-4 py-6 text-center text-gray-600"
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