import { useEffect, useState } from "react";
import { listCarouselAdmin, saveCarousel, uploadImage } from "../lib/api";
import { useAuth } from "../auth/AuthContext";

export default function CarouselModal({ open, onClose }) {
  const { auth } = useAuth();

  const [items, setItems] = useState([
    { url: "", position: 1, active: true },
    { url: "", position: 2, active: true },
    { url: "", position: 3, active: true },
  ]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState({}); // { [index]: boolean }
  const [fileNames, setFileNames] = useState({}); // { [index]: string }

  // ---- carregar itens quando abrir
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    listCarouselAdmin(auth)
      .then((data) => {
        if (Array.isArray(data) && data.length) {
          setItems(
            data
              .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
              .map((d, i) => ({
                url: d.url ?? "",
                position: d.position ?? i + 1,
                active: d.active ?? true,
              }))
          );
        }
      })
      .finally(() => setLoading(false));
  }, [open, auth]);

  const updateItem = (i, patch) => {
    setItems((arr) => {
      const copy = [...arr];
      copy[i] = { ...copy[i], ...patch };
      return copy;
    });
  };

  const addSlot = () =>
    setItems((arr) => [...arr, { url: "", position: arr.length + 1, active: true }]);

  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const copy = [...items];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    copy.forEach((x, idx) => (x.position = idx + 1));
    setItems(copy);
  };

  // ---- upload por slot (com botão estilizado)
  const onPickFile = async (i, file) => {
    if (!file) return;
    setFileNames((s) => ({ ...s, [i]: file.name }));
    setUploading((s) => ({ ...s, [i]: true }));
    try {
      const up = await uploadImage(file, auth);
      const url = up?.url || up?.path || up;
      updateItem(i, { url });
    } catch (e) {
      alert("Falha no upload: " + (e?.message || e));
    } finally {
      setUploading((s) => ({ ...s, [i]: false }));
    }
  };

  const clearUrl = (i) => {
    updateItem(i, { url: "" });
    setFileNames((s) => ({ ...s, [i]: "" }));
  };

  const onSave = async () => {
    setLoading(true);
    try {
      await saveCarousel(
        items.map((x, idx) => ({
          url: x.url,
          position: idx + 1,
          active: !!x.active,
        })),
        auth
      );
      localStorage.setItem("carousel:refresh", String(Date.now()));
      onClose?.(true);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-5 border-b border-black/10">
          <h2 className="text-xl font-semibold">Editar carrossel</h2>
          <button
            onClick={() => onClose?.(false)}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200"
          >
            Fechar
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-4">
          {loading ? (
            <div className="py-10 text-center text-slate-600">Carregando…</div>
          ) : (
            <>
              <div className="space-y-4 max-h-[60vh] overflow-auto pr-1">
                {items.map((it, i) => (
                  <SlotRow
                    key={i + (it.url || "")}
                    i={i}
                    item={it}
                    uploading={!!uploading[i]}
                    fileName={fileNames[i]}
                    updateItem={updateItem}
                    move={move}
                    onPickFile={onPickFile}
                    clearUrl={clearUrl}
                  />
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={addSlot}
                  className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200"
                >
                  Adicionar slot
                </button>

                <button
                  onClick={onSave}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg text-white font-medium shadow
                             disabled:opacity-60"
                  style={{ background: "linear-gradient(90deg, var(--laranja), var(--rosa))" }}
                >
                  {loading ? "Salvando…" : "Salvar carrossel"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Slot estilizado ---------- */
function SlotRow({
  i,
  item,
  uploading,
  fileName,
  updateItem,
  move,
  onPickFile,
  clearUrl,
}) {
  const inputId = `file-slot-${i}`;

  return (
    <div className="rounded-xl border border-black/10 p-3 grid grid-cols-12 gap-3 bg-white/70">
      {/* Preview */}
      <div className="col-span-12 sm:col-span-3">
        <div className="aspect-[16/10] rounded-lg border border-black/10 overflow-hidden bg-slate-50 flex items-center justify-center">
          {item.url ? (
            <img src={item.url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="text-xs text-slate-500">Sem imagem</div>
          )}
        </div>
      </div>

      {/* Campos e ações */}
      <div className="col-span-12 sm:col-span-9 grid grid-cols-12 gap-2">
        {/* URL */}
        <div className="col-span-12">
          <div className="flex gap-2">
            <input
              className="flex-1 border border-black/20 rounded-lg px-3 py-2"
              placeholder="URL da imagem (ou envie um arquivo)"
              value={item.url}
              onChange={(e) => updateItem(i, { url: e.target.value })}
            />
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 rounded-lg border border-black/20 hover:bg-slate-50 text-sm"
                title="Abrir imagem"
              >
                Abrir
              </a>
            )}
            {item.url && (
              <button
                onClick={() => clearUrl(i)}
                className="px-3 py-2 rounded-lg border border-black/20 hover:bg-slate-50 text-sm"
                title="Limpar URL"
              >
                Remover
              </button>
            )}
          </div>
        </div>

        {/* Linha 2: Upload + toggle + ordenar */}
        <div className="col-span-12 flex flex-wrap items-center gap-2">
          {/* Botão de upload estilizado (input escondido) */}
          <input
            id={inputId}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => onPickFile(i, e.target.files?.[0])}
          />
          <label
            htmlFor={inputId}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-black/20 bg-white hover:bg-slate-50 cursor-pointer text-sm shadow-sm"
          >
            {uploading ? (
              <span className="animate-pulse">Enviando…</span>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-70">
                  <path fill="currentColor" d="M5 20q-.825 0-1.412-.587T3 18V8q0-.825.588-1.412T5 6h4l2 2h8q.825 0 1.413.588T21 10v8q0 .825-.587 1.413T19 20H5Z"/>
                </svg>
                {fileName ? "Trocar arquivo" : "Enviar imagem"}
              </>
            )}
          </label>
          {fileName && <span className="text-xs text-slate-600">({fileName})</span>}

          {/* Toggle Ativo */}
          <label className="ml-2 inline-flex items-center gap-2 text-sm select-none">
            <span className="text-slate-700">Ativo</span>
            <span className="relative inline-flex items-center">
              <input
                type="checkbox"
                checked={!!item.active}
                onChange={(e) => updateItem(i, { active: e.target.checked })}
                className="sr-only peer"
              />
              <span className="w-10 h-5 rounded-full bg-slate-300 peer-checked:bg-emerald-500 transition-colors" />
              <span className="absolute left-0 top-0 w-5 h-5 bg-white rounded-full shadow transform peer-checked:translate-x-5 transition-transform" />
            </span>
          </label>

          {/* Ordenação */}
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => move(i, -1)}
              className="px-2.5 py-1.5 rounded-lg border border-black/20 hover:bg-slate-50 text-sm"
              title="Subir"
            >
              ↑
            </button>
            <button
              onClick={() => move(i, +1)}
              className="px-2.5 py-1.5 rounded-lg border border-black/20 hover:bg-slate-50 text-sm"
              title="Descer"
            >
              ↓
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
