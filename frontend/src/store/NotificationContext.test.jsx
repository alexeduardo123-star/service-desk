import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
// Com extensão: sem ela, no Windows (sem diferença de maiúsculas) o import cairia em notificationContext.js.
import { NotificationProvider } from "./NotificationContext.jsx";
import { useNotification } from "./useNotification";

function Disparador() {
  const { notificar } = useNotification();
  return (
    <>
      <button type="button" onClick={() => notificar("Salvo com sucesso")}>Sucesso</button>
      <button type="button" onClick={() => notificar("Deu erro", "erro")}>Erro</button>
    </>
  );
}

function renderizar() {
  return render(
    <NotificationProvider>
      <Disparador />
    </NotificationProvider>
  );
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("NotificationProvider (toasts)", () => {
  it("as regiões de anúncio já existem antes de qualquer aviso", () => {
    renderizar();
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    expect(screen.getByRole("alert")).toBeEmptyDOMElement();
  });

  it("sucesso é anunciado de forma educada (status)", () => {
    renderizar();
    fireEvent.click(screen.getByRole("button", { name: "Sucesso" }));

    expect(screen.getByRole("status")).toHaveTextContent("Salvo com sucesso");
    expect(screen.getByRole("alert")).toBeEmptyDOMElement();
  });

  it("erro é anunciado como alerta", () => {
    renderizar();
    fireEvent.click(screen.getByRole("button", { name: "Erro" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Deu erro");
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("some depois de 4 s, e um aviso novo reinicia o tempo", () => {
    renderizar();
    fireEvent.click(screen.getByRole("button", { name: "Sucesso" }));
    act(() => vi.advanceTimersByTime(3000));
    fireEvent.click(screen.getByRole("button", { name: "Erro" }));

    // O timer do primeiro aviso venceria aqui; o segundo tem que continuar na tela.
    act(() => vi.advanceTimersByTime(1500));
    expect(screen.getByRole("alert")).toHaveTextContent("Deu erro");

    act(() => vi.advanceTimersByTime(2600));
    expect(screen.getByRole("alert")).toBeEmptyDOMElement();
  });
});
