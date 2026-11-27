import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

const FOCAVEIS =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Janela modal acessível usada em todo o sistema:
// - role="dialog" + aria-modal, com o título como nome acessível;
// - o foco vai para dentro ao abrir, fica preso nela (Tab/Shift+Tab giram) e
//   volta para quem abriu ao fechar;
// - Esc e clique no fundo fecham;
// - no celular ocupa a largura toda e rola por dentro, sem passar da tela.
// Vai para o <body> por portal, para não ficar dentro de formulários da página.
export default function Modal({ titulo, onFechar, children, largura = "max-w-md" }) {
  const idTitulo = useId();
  const caixa = useRef(null);
  const fecharRef = useRef(onFechar);

  useEffect(() => {
    fecharRef.current = onFechar;
  }, [onFechar]);

  useEffect(() => {
    const anterior = document.activeElement;
    const elementos = () => [...(caixa.current?.querySelectorAll(FOCAVEIS) ?? [])];

    // Respeita um autoFocus de dentro do modal; senão foca o primeiro campo.
    if (!caixa.current?.contains(document.activeElement)) {
      (elementos()[0] ?? caixa.current)?.focus();
    }

    function teclado(e) {
      if (e.key === "Escape") {
        e.stopPropagation();
        fecharRef.current?.();
        return;
      }
      if (e.key !== "Tab") return;
      const lista = elementos();
      if (lista.length === 0) {
        e.preventDefault();
        return;
      }
      const primeiro = lista[0];
      const ultimo = lista[lista.length - 1];
      if (e.shiftKey && document.activeElement === primeiro) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    }

    document.addEventListener("keydown", teclado);
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", teclado);
      document.body.style.overflow = overflowAnterior;
      if (anterior instanceof HTMLElement) anterior.focus();
    };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onFechar()}
    >
      <div
        ref={caixa}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        tabIndex={-1}
        className={`flex max-h-[90vh] w-full ${largura} flex-col rounded-t-lg bg-white p-5 shadow-lg sm:rounded-lg`}
      >
        <h2 id={idTitulo} className="mb-4 text-lg font-semibold text-gray-900">
          {titulo}
        </h2>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body
  );
}
