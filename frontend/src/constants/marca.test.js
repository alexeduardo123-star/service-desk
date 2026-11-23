import { describe, it, expect } from "vitest";
import { NOME_APP } from "./marca";

describe("marca", () => {
  it("o nome do produto é FlowDesk", () => {
    expect(NOME_APP).toBe("FlowDesk");
  });
});
