export function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validarCampoObrigatorio(valor) {
  return valor !== undefined && valor !== null && String(valor).trim() !== "";
}
