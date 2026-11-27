import { useEffect, useState } from "react";
import Botao from "../components/Botao";
import CabecalhoPagina from "../components/CabecalhoPagina";
import InputField from "../components/InputField";
import TextAreaField from "../components/TextAreaField";
import { Carregando, ErroCarregar } from "../components/Estados";
import SelectField from "../components/SelectField";
import Toggle from "../components/Toggle";
import SituacaoBadge from "../components/SituacaoBadge";
import FormularioPreview from "../components/FormularioPreview";
import formularioService from "../services/formularioService";
import { useNotification } from "../store/useNotification";
import {
  TIPOS_CAMPO,
  formularioParaEdicao,
  formularioVazio,
  montarPayload,
  moverCampo,
  novoCampo,
  opcoesDoTexto,
  validarFormulario,
} from "../utils/formularioCampos";

export default function Formularios() {
  const { notificar } = useNotification();
  const [formularios, setFormularios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [falhou, setFalhou] = useState(false);
  const [form, setForm] = useState(null);
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    setCarregando(true);
    try {
      setFormularios(await formularioService.listar());
      setFalhou(false);
    } catch {
      setFalhou(true);
      notificar("Erro ao carregar formulários", "erro");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    // Agenda o carregamento para evitar setState síncrono no corpo do efeito.
    Promise.resolve().then(carregar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function alterar(alteracoes) {
    setForm((atual) => ({ ...atual, ...alteracoes }));
  }

  function alterarCampo(chave, alteracoes) {
    setForm((atual) => ({
      ...atual,
      campos: atual.campos.map((campo) => (campo.chave === chave ? { ...campo, ...alteracoes } : campo)),
    }));
  }

  function adicionarCampo() {
    setForm((atual) => ({ ...atual, campos: [...atual.campos, novoCampo()] }));
  }

  function removerCampo(chave) {
    setForm((atual) => ({ ...atual, campos: atual.campos.filter((campo) => campo.chave !== chave) }));
  }

  function mover(indice, deslocamento) {
    setForm((atual) => ({ ...atual, campos: moverCampo(atual.campos, indice, deslocamento) }));
  }

  async function salvar(evento) {
    evento.preventDefault();

    const erro = validarFormulario(form);
    if (erro) {
      notificar(erro, "erro");
      return;
    }

    setSalvando(true);
    try {
      const dados = montarPayload(form);
      if (form.id) {
        await formularioService.atualizar(form.id, dados);
        notificar("Formulário atualizado com sucesso");
      } else {
        await formularioService.criar(dados);
        notificar("Formulário criado com sucesso");
      }
      setForm(null);
      await carregar();
    } catch (err) {
      notificar(err.response?.data?.erro || "Erro ao salvar formulário", "erro");
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(formulario) {
    if (!confirm(`Confirma a exclusão do formulário "${formulario.nome}"?`)) return;

    try {
      await formularioService.excluir(formulario.id);
      notificar("Formulário excluído");
      await carregar();
    } catch (err) {
      notificar(err.response?.data?.erro || "Erro ao excluir formulário", "erro");
    }
  }

  const camposPrevia = form?.campos.map((campo) => ({ ...campo, opcoes: opcoesDoTexto(campo.opcoesTexto) })) ?? [];

  return (
    <div>
      <CabecalhoPagina
        titulo="Formulários"
        descricao="Monte os campos extras que o solicitante preenche ao abrir um chamado. O formulário é vinculado no cadastro do assunto."
      >
        {!form && <Botao type="button" onClick={() => setForm(formularioVazio())}>Novo</Botao>}
      </CabecalhoPagina>

      {form && (
        <form onSubmit={salvar} className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <InputField
                label="Nome do formulário"
                required
                value={form.nome}
                onChange={(evento) => alterar({ nome: evento.target.value })}
              />
              <InputField
                label="Descrição"
                value={form.descricao}
                onChange={(evento) => alterar({ descricao: evento.target.value })}
              />
            </div>
            <Toggle
              label="Ativo"
              descricao="Formulários inativos continuam vinculados, mas podem ser revisados antes do uso"
              checked={form.ativo}
              onChange={(ativo) => alterar({ ativo })}
            />

            <h2 className="mt-2 mb-2 text-sm font-semibold text-gray-900">Campos</h2>
            <ol className="flex flex-col gap-3">
              {form.campos.map((campo, indice) => (
                <li key={campo.chave} className="rounded-md border border-gray-200 bg-gray-50 p-3">
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
                    <InputField
                      label={`Campo ${indice + 1}`}
                      placeholder="Ex.: Número do patrimônio"
                      required
                      value={campo.rotulo}
                      onChange={(evento) => alterarCampo(campo.chave, { rotulo: evento.target.value })}
                    />
                    <SelectField
                      label="Tipo"
                      aria-label={`Tipo do campo ${indice + 1}`}
                      options={TIPOS_CAMPO}
                      value={campo.tipo}
                      onChange={(evento) => alterarCampo(campo.chave, { tipo: evento.target.value })}
                    />
                  </div>

                  {campo.tipo === "SELECAO" && (
                    <div className="mt-3">
                      <TextAreaField
                        label="Opções (uma por linha)"
                        value={campo.opcoesTexto}
                        onChange={(evento) => alterarCampo(campo.chave, { opcoesTexto: evento.target.value })}
                      />
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={campo.obrigatorio}
                        onChange={(evento) => alterarCampo(campo.chave, { obrigatorio: evento.target.checked })}
                      />
                      Obrigatório
                    </label>
                    <div className="flex gap-3">
                      <Botao
                        type="button"
                        variante="link"
                        className="text-gray-700"
                        aria-label={`Subir o campo ${indice + 1}`}
                        disabled={indice === 0}
                        onClick={() => mover(indice, -1)}
                      >
                        <span aria-hidden="true">↑</span> Subir
                      </Botao>
                      <Botao
                        type="button"
                        variante="link"
                        className="text-gray-700"
                        aria-label={`Descer o campo ${indice + 1}`}
                        disabled={indice === form.campos.length - 1}
                        onClick={() => mover(indice, 1)}
                      >
                        <span aria-hidden="true">↓</span> Descer
                      </Botao>
                      <Botao
                        type="button"
                        variante="linkPerigo"
                        aria-label={`Remover o campo ${indice + 1}`}
                        onClick={() => removerCampo(campo.chave)}
                      >
                        Remover
                      </Botao>
                    </div>
                  </div>
                </li>
              ))}
            </ol>

            <Botao type="button" variante="link" className="mt-3" onClick={adicionarCampo}>
              + Adicionar campo
            </Botao>

            <div className="mt-4 flex flex-wrap gap-2">
              <Botao type="submit" disabled={salvando}>
                {form.id ? "Salvar alterações" : "Criar"}
              </Botao>
              <Botao type="button" variante="secundario" onClick={() => setForm(null)}>
                Cancelar
              </Botao>
            </div>
          </div>

          <aside className="h-fit rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-gray-900">Prévia</h2>
            <FormularioPreview campos={camposPrevia} />
          </aside>
        </form>
      )}

      {carregando ? (
        <Carregando />
      ) : falhou ? (
        <ErroCarregar texto="Não foi possível carregar os formulários." onTentarDeNovo={carregar} />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white" tabIndex={0} role="region" aria-label="Formulários cadastrados">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="whitespace-nowrap px-4 py-2 text-left font-medium text-gray-700">Formulário</th>
                <th scope="col" className="whitespace-nowrap px-4 py-2 text-left font-medium text-gray-700">Campos</th>
                <th scope="col" className="whitespace-nowrap px-4 py-2 text-left font-medium text-gray-700">Assuntos vinculados</th>
                <th scope="col" className="whitespace-nowrap px-4 py-2 text-left font-medium text-gray-700">Situação</th>
                <th scope="col" className="px-4 py-2"><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {formularios.map((formulario) => (
                <tr key={formulario.id}>
                  <td className="px-4 py-2 text-gray-800">
                    <span className="block">{formulario.nome}</span>
                    {formulario.descricao && (
                      <span className="block text-xs text-gray-500">{formulario.descricao}</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-gray-800">{formulario.campos?.length ?? 0}</td>
                  <td className="px-4 py-2 text-gray-800">{formulario._count?.assuntos ?? 0}</td>
                  <td className="px-4 py-2">
                    <SituacaoBadge ativo={formulario.ativo} />
                  </td>
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    <Botao
                      type="button"
                      variante="link"
                      className="mr-3"
                      aria-label={`Editar ${formulario.nome}`}
                      onClick={() => setForm(formularioParaEdicao(formulario))}
                    >
                      Editar
                    </Botao>
                    <Botao type="button" variante="linkPerigo" aria-label={`Excluir ${formulario.nome}`} onClick={() => excluir(formulario)}>
                      Excluir
                    </Botao>
                  </td>
                </tr>
              ))}

              {formularios.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-600">
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
