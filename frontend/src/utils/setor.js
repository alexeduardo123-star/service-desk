// "Setor" é o nome que as telas usam para o model Departamento.

// Setor que já vem marcado ao abrir um chamado: o do usuário logado. Sem setor
// cadastrado, o campo começa vazio e a pessoa precisa escolher.
export function setorInicial(perfil) {
  return perfil?.departamentoId ? String(perfil.departamentoId) : "";
}

// Opções do <SelectField> a partir da lista de departamentos da API.
export function opcoesSetor(departamentos = []) {
  return departamentos.map((d) => ({ value: d.id, label: d.nome }));
}
