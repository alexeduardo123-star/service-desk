import { describe, expect, it } from "vitest";
import { STATUS_SELECIONAVEIS, podeRetomar, podeSuspender } from "./suspensao";
import { CORES_STATUS } from "../constants/cores";
import { STATUS_COR, STATUS_LABEL } from "../constants/labels";

describe("suspensão", () => {
  it("o seletor de status não oferece Suspenso (exige motivo)", () => {
    expect(STATUS_SELECIONAVEIS).toEqual(["ABERTO", "EM_ANDAMENTO", "AGUARDANDO_USUARIO", "FECHADO"]);
  });

  it("pode suspender chamado em aberto, mas não fechado nem já suspenso", () => {
    for (const status of ["ABERTO", "EM_ANDAMENTO", "AGUARDANDO_USUARIO"]) {
      expect(podeSuspender({ status })).toBe(true);
    }
    expect(podeSuspender({ status: "FECHADO" })).toBe(false);
    expect(podeSuspender({ status: "SUSPENSO" })).toBe(false);
  });

  it("só retoma chamado suspenso", () => {
    expect(podeRetomar({ status: "SUSPENSO" })).toBe(true);
    for (const status of ["ABERTO", "EM_ANDAMENTO", "AGUARDANDO_USUARIO", "FECHADO"]) {
      expect(podeRetomar({ status })).toBe(false);
    }
  });

  it("Suspenso tem rótulo, cor de badge e cor de gráfico", () => {
    expect(STATUS_LABEL.SUSPENSO).toBe("Suspenso");
    expect(STATUS_COR.SUSPENSO).toBeTruthy();
    expect(CORES_STATUS.SUSPENSO).toMatch(/^#[0-9a-f]{6}$/);
  });
});
