import { useEffect } from "react";

export default function ConfirmDialog({
  open,
  title = "Confirmar",
  message = "Tem certeza?",
  confirmText = "Excluir",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
}) {
  // fechar com ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onCancel?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      {/* BACKDROP */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onCancel}
      />

      {/* CAIXA */}
      <div
        className="relative w-[92%] max-w-md rounded-2xl border border-black/10 p-5 shadow-[0_20px_50px_rgba(0,0,0,.35)]"
        style={{
          background:
            "linear-gradient(135deg, #fff 0%, rgba(255,255,255,.96) 60%, rgba(255,255,255,.92) 100%), radial-gradient(600px 300px at 120% -40%, var(--amarelo) 0 35%, transparent 36%), radial-gradient(520px 280px at -10% 120%, var(--rosa) 0 35%, transparent 36%)",
        }}
      >
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-slate-700 mb-5">{message}</p>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="px-3 py-1.5 rounded border border-black/20"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className="px-3 py-1.5 rounded text-white"
            style={{ background: "linear-gradient(90deg, var(--laranja), var(--rosa))" }}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>

        {/* brilho suave na borda inferior */}
        <div
          className="pointer-events-none absolute -bottom-2 left-8 right-8 h-2 rounded-full"
          style={{ background: "radial-gradient(80% 100% at 50% 0, rgba(0,0,0,.18), transparent 70%)" }}
        />
      </div>
    </div>
  );
}
