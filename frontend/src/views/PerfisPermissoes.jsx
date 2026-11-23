import { useEffect, useState } from "react";
import permissaoService from "../services/permissaoService";
import { useNotification } from "../store/useNotification";
import { PAPEL_LABEL } from "../constants/labels";

// Matriz perfil x permissão. O administrador marca o que cada perfil pode fazer;
// o perfil Administrador sempre tem tudo e aparece travado.
export default function PerfisPermissoes() {
  const [dados, setDados] = useState(null);
  const [salvando, setSalvando] = useState("");
  const { notificar } = useNotification();

  useEffect(() => {
    permissaoService
      .listar()
      .then(setDados)
      .catch(() => notificar("Erro ao carregar permissões", "erro"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function alternar(papel, permissao, concedida) {
    const chave = `${papel}:${permissao}`;
    setSalvando(chave);
    try {
      const resposta = await permissaoService.atualizar(papel, permissao, concedida);
      setDados((atual) => ({ ...atual, matriz: resposta.matriz }));
    } catch (err) {
      notificar(err.response?.data?.erro || "Não foi possível salvar a permissão", "erro");
    } finally {
      setSalvando("");
    }
  }

  if (!dados) return <p className="text-sm text-gray-500">Carregando...</p>;

  const grupos = [...new Set(dados.permissoes.map((p) => p.grupo))];

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">Perfis e permissões</h1>
      <p className="mt-1 mb-4 text-sm text-gray-600">
        Defina o que cada perfil pode fazer no sistema. As mudanças valem na hora, para todos os usuários do perfil.
      </p>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Permissão</th>
              {dados.papeis.map((papel) => (
                <th key={papel} className="px-4 py-3 text-center">
                  {PAPEL_LABEL[papel] ?? papel}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grupos.map((grupo) => (
              <GrupoLinhas
                key={grupo}
                grupo={grupo}
                permissoes={dados.permissoes.filter((p) => p.grupo === grupo)}
                papeis={dados.papeis}
                matriz={dados.matriz}
                salvando={salvando}
                onAlternar={alternar}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GrupoLinhas({ grupo, permissoes, papeis, matriz, salvando, onAlternar }) {
  return (
    <>
      <tr className="bg-gray-100">
        <td colSpan={papeis.length + 1} className="px-4 py-2 text-xs font-semibold uppercase text-gray-600">
          {grupo}
        </td>
      </tr>
      {permissoes.map((p) => (
        <tr key={p.chave} className="border-t border-gray-100">
          <td className="px-4 py-2 text-gray-800">{p.rotulo}</td>
          {papeis.map((papel) => {
            const travado = papel === "ADMIN";
            const marcado = Boolean(matriz[papel]?.[p.chave]);
            return (
              <td key={papel} className="px-4 py-2 text-center">
                <input
                  type="checkbox"
                  aria-label={`${PAPEL_LABEL[papel] ?? papel}: ${p.rotulo}`}
                  checked={marcado}
                  disabled={travado || salvando === `${papel}:${p.chave}`}
                  onChange={(e) => onAlternar(papel, p.chave, e.target.checked)}
                />
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}
