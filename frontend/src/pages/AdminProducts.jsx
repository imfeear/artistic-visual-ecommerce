import { useEffect, useState, useMemo } from "react";
import {
  createProduct,
  getTrackSummary,
  updateProduct,
  deleteProduct,
  listProducts,
} from "../lib/api";
import { useAuth } from "../auth/AuthContext";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import ConfirmDialog from "../components/ConfirmDialog";

/* ===== util ===== */
function prettyLabel(meta) {
  if (!meta) return "Outro";
  if (meta === "whatsapp_button") return "Botão WhatsApp";
  if (meta === "nav_loja") return "Menu: Loja";
  if (meta === "nav_destaques") return "Menu: Destaques";
  if (meta === "nav_contato") return "Menu: Contato";
  if (meta === "hero_arrow_left") return "Carrossel: Anterior";
  if (meta === "hero_arrow_right") return "Carrossel: Próximo";
  if (meta.startsWith("hero_dot_"))
    return `Carrossel: Dot ${meta.replace("hero_dot_", "")}`;
  if (meta.startsWith("search:")) return `Busca: “${meta.slice(7)}”`;
  return meta;
}
const formatDateBR = (iso) => {
  try {
    const [y, m, d] = String(iso).split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("pt-BR");
  } catch {
    return iso;
  }
};
const COLORS = ["#06B6D4", "#7aa6b4", "#FF7A00", "#FF3EA5", "#FFD100", "#00C853"];

/* ===== página ===== */
export default function AdminProducts() {
  const { auth, logout } = useAuth();

  /* ---------- FORM CRIAR ---------- */
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    available: true,
  });
  const [status, setStatus] = useState("");

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((s) => ({ ...s, [name]: type === "checkbox" ? checked : value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setStatus("Enviando...");
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        imageUrl: form.imageUrl.trim(),
        available: !!form.available,
      };
      const created = await createProduct(payload, auth);
      setStatus(`Criado: #${created.id} ${created.name}`);
      localStorage.setItem("products:refresh", String(Date.now()));
      setForm({
        name: "",
        description: "",
        price: "",
        imageUrl: "",
        available: true,
      });
      await Promise.all([loadStats(), loadProducts()]);
    } catch (err) {
      const msg = String(err.message);
      setStatus(`Erro: ${msg}`);
      if (msg.includes("401") || msg.includes("403")) {
        setStatus("Sessão expirada. Faça login novamente.");
        logout();
      }
    }
  };

  /* ---------- LISTA/CRUD ---------- */
  const [products, setProducts] = useState([]);
  const [editId, setEditId] = useState(null);
  const [row, setRow] = useState({ name: "", price: "", available: true });

  // modal de exclusão
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null); // { id, name }

  const loadProducts = async () => {
    try {
      const data = await listProducts();
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setProducts([]);
    }
  };

  const startEdit = (p) => {
    setEditId(p.id);
    setRow({
      name: p.name ?? "",
      price: p.price ?? "",
      available: !!p.available,
      imageUrl: p.imageUrl ?? "",
      description: p.description ?? "",
    });
  };

  const cancelEdit = () => {
    setEditId(null);
  };

  const saveEdit = async (id) => {
    const payload = {
      name: row.name.trim(),
      description: String(row.description ?? "").trim(),
      price: Number(row.price),
      imageUrl: String(row.imageUrl ?? "").trim(),
      available: !!row.available,
    };
    await updateProduct(id, payload, auth);
    setEditId(null);
    await loadProducts();
  };

  const askRemove = (p) => {
    setToDelete({ id: p.id, name: p.name });
    setConfirmOpen(true);
  };

  const doRemove = async () => {
    if (!toDelete) return;
    try {
      await deleteProduct(toDelete.id, auth);
      await loadProducts();
    } finally {
      setConfirmOpen(false);
      setToDelete(null);
    }
  };

  /* ---------- ESTATÍSTICAS ---------- */
  const [days, setDays] = useState(7);
  const [loadingStats, setLoadingStats] = useState(true);
  const [summary, setSummary] = useState(null);
  const [errStats, setErrStats] = useState("");

  const loadStats = async () => {
    setLoadingStats(true);
    setErrStats("");
    try {
      const s = await getTrackSummary(days, auth);
      setSummary(s);
    } catch (e) {
      setErrStats(String(e.message));
    } finally {
      setLoadingStats(false);
    }
  };
  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  useEffect(() => {
    loadProducts();
  }, []);

  const byType = summary?.countsByType || {};
  const top = useMemo(
    () =>
      (summary?.topClicks || []).map((t) => ({
        ...t,
        label: prettyLabel(t.label),
      })),
    [summary]
  );
  const pv = (summary?.pageviewsByDay || []).map((d) => ({
    date: formatDateBR(d.date),
    count: d.count,
  }));

  return (
    <div className="min-h-screen">
      {/* ===== CABEÇALHO NOVO ===== */}
      <div
        className="w-full"
        style={{
          background: "linear-gradient(90deg, var(--azul), var(--ciano))",
          boxShadow: "0 2px 10px rgba(0,0,0,.12)",
        }}
      >
        <div className="mx-auto max-w-6xl px-6 py-3 flex items-center justify-between">
          <h1 className="text-white text-xl font-semibold tracking-tight">
            Painel • Produtos
          </h1>
          <button
            onClick={logout}
            className="text-white text-sm px-3 py-1.5 rounded-full border border-white/70 hover:bg-white/10"
            title="Sair do painel"
          >
            Encerrar sessão
          </button>
        </div>
      </div>

      <div className="p-6 mx-auto max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_minmax(440px,520px)]">
          {/* --------- FORM + LISTA --------- */}
          <div className="space-y-6">
            {/* Criar */}
            <div className="rounded-2xl border border-black/10 bg-white/90 backdrop-blur p-5 shadow-[0_10px_24px_rgba(0,0,0,.12)]">
              <h2 className="text-lg font-semibold mb-3">Cadastrar item</h2>
              <form onSubmit={submit} className="grid gap-4">
                <input
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  placeholder="Nome do produto"
                  className="border border-black/10 rounded-lg p-2"
                />
                <textarea
                  name="description"
                  value={form.description}
                  onChange={onChange}
                  placeholder="Descrição"
                  className="border border-black/10 rounded-lg p-2"
                />
                <input
                  name="price"
                  value={form.price}
                  onChange={onChange}
                  placeholder="Preço"
                  type="number"
                  step="0.01"
                  className="border border-black/10 rounded-lg p-2"
                />
                <input
                  name="imageUrl"
                  value={form.imageUrl}
                  onChange={onChange}
                  placeholder="URL da imagem"
                  className="border border-black/10 rounded-lg p-2"
                />
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="available"
                    checked={form.available}
                    onChange={onChange}
                  />
                  Disponível para venda
                </label>
                <button
                  className="px-4 py-2 rounded-lg text-white font-medium shadow hover:opacity-95"
                  style={{
                    background:
                      "linear-gradient(90deg, var(--laranja), var(--rosa))",
                  }}
                >
                  Criar produto
                </button>
              </form>
              {status && <p className="mt-4 text-sm">{status}</p>}
            </div>

            {/* Lista / edição */}
            <div className="rounded-2xl border border-black/10 bg-white/90 backdrop-blur p-5 shadow-[0_10px_24px_rgba(0,0,0,.12)]">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Produtos cadastrados</h2>
                <button
                  onClick={loadProducts}
                  className="text-sm px-3 py-1 rounded text-white"
                  style={{
                    background:
                      "linear-gradient(90deg, var(--ciano), var(--azul))",
                  }}
                >
                  Recarregar
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-600">
                      <th className="py-2 pr-4">#</th>
                      <th className="py-2 pr-4">Nome</th>
                      <th className="py-2 pr-4">Preço</th>
                      <th className="py-2 pr-4">Disponível</th>
                      <th className="py-2 pr-4">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} className="border-t border-black/5">
                        <td className="py-2 pr-4">{p.id}</td>

                        {/* Nome */}
                        <td className="py-2 pr-4">
                          {editId === p.id ? (
                            <input
                              className="border rounded px-2 py-1 w-full"
                              value={row.name}
                              onChange={(e) =>
                                setRow((s) => ({ ...s, name: e.target.value }))
                              }
                            />
                          ) : (
                            <span>{p.name}</span>
                          )}
                        </td>

                        {/* Preço */}
                        <td className="py-2 pr-4">
                          {editId === p.id ? (
                            <input
                              type="number"
                              step="0.01"
                              className="border rounded px-2 py-1 w-28"
                              value={row.price}
                              onChange={(e) =>
                                setRow((s) => ({ ...s, price: e.target.value }))
                              }
                            />
                          ) : (
                            <span>R$ {Number(p.price ?? 0).toFixed(2)}</span>
                          )}
                        </td>

                        {/* Disponível */}
                        <td className="py-2 pr-4">
                          {editId === p.id ? (
                            <input
                              type="checkbox"
                              checked={!!row.available}
                              onChange={(e) =>
                                setRow((s) => ({
                                  ...s,
                                  available: e.target.checked,
                                }))
                              }
                            />
                          ) : p.available ? (
                            "Sim"
                          ) : (
                            "Não"
                          )}
                        </td>

                        {/* Ações */}
                        <td className="py-2 pr-4">
                          {editId === p.id ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => saveEdit(p.id)}
                                className="text-white text-xs px-3 py-1 rounded"
                                style={{
                                  background:
                                    "linear-gradient(90deg, var(--ciano), var(--azul))",
                                }}
                              >
                                Salvar
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="text-xs px-3 py-1 rounded border border-black/20"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={() => startEdit(p)}
                                className="text-white text-xs px-3 py-1 rounded"
                                style={{
                                  background:
                                    "linear-gradient(90deg, var(--ciano), var(--azul))",
                                }}
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => askRemove(p)}
                                className="text-white text-xs px-3 py-1 rounded"
                                style={{ background: "var(--rosa)" }}
                              >
                                Excluir
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {products.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-6 text-center text-slate-600"
                        >
                          Nenhum produto cadastrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* --------- PAINEL ESTATÍSTICAS --------- */}
          <aside
            className="rounded-2xl p-4 shadow-[0_14px_36px_rgba(0,0,0,.18)] border"
            style={{
              background:
                "linear-gradient(135deg, #fff 0%, rgba(255,255,255,.92) 50%, rgba(255,255,255,.86) 100%), radial-gradient(800px 500px at 110% -20%, var(--amarelo) 0 30%, transparent 31%), radial-gradient(700px 500px at -6% 120%, var(--rosa) 0 30%, transparent 31%)",
              borderColor: "rgba(0,0,0,.12)",
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-lg font-semibold">Estatísticas do site</h2>
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="border border-black/10 rounded p-1 text-sm bg-white/90"
                title="Período"
              >
                <option value={1}>1 dia</option>
                <option value={7}>7 dias</option>
                <option value={30}>30 dias</option>
              </select>
              <button
                onClick={loadStats}
                className="px-3 py-1 rounded text-white text-sm"
                style={{
                  background:
                    "linear-gradient(90deg, var(--ciano), var(--azul))",
                }}
              >
                Atualizar
              </button>
            </div>

            {errStats && (
              <p className="text-red-700 text-sm mb-2">Erro: {errStats}</p>
            )}

            {/* KPIs */}
            <div className="grid sm:grid-cols-3 gap-3 mb-4">
              <div className="rounded-xl border border-black/10 bg-white/90 p-3">
                <div className="text-xs text-slate-600">Pageviews</div>
                <div className="text-2xl font-bold">
                  {loadingStats ? "…" : byType.PAGEVIEW ?? 0}
                </div>
              </div>
              <div className="rounded-xl border border-black/10 bg-white/90 p-3">
                <div className="text-xs text-slate-600">Cliques</div>
                <div className="text-2xl font-bold">
                  {loadingStats ? "…" : byType.CLICK ?? 0}
                </div>
              </div>
              <div className="rounded-xl border border-black/10 bg-white/90 p-3">
                <div className="text-xs text-slate-600">Visitantes únicos</div>
                <div className="text-2xl font-bold">
                  {loadingStats ? "…" : summary?.uniqueIps ?? 0}
                </div>
              </div>
            </div>

            {/* GRÁFICOS */}
            <div className="grid gap-4">
              {/* Pizza */}
              <div className="rounded-xl border border-black/10 bg-white/90 p-3">
                <h3 className="font-semibold mb-2">Top cliques</h3>
                <div style={{ width: "100%", height: 220 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        dataKey="count"
                        nameKey="label"
                        data={top}
                        outerRadius={80}
                        label
                      >
                        {top.map((_, idx) => (
                          <Cell
                            key={idx}
                            fill={COLORS[idx % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Legend verticalAlign="bottom" height={24} />
                      <Tooltip formatter={(v) => [`${v}`, "Cliques"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {!loadingStats && top.length === 0 && (
                  <p className="text-sm text-slate-600">Sem dados</p>
                )}
              </div>

              {/* Barras */}
              <div className="rounded-xl border border-black/10 bg-white/90 p-3">
                <h3 className="font-semibold mb-2">Pageviews por dia</h3>
                <div style={{ width: "100%", height: 220 }}>
                  <ResponsiveContainer>
                    <BarChart data={pv}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar
                        dataKey="count"
                        name="Pageviews"
                        fill="#06B6D4"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {!loadingStats && pv.length === 0 && (
                  <p className="text-sm text-slate-600">Sem dados</p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ===== MODAL DE CONFIRMAÇÃO ===== */}
      <ConfirmDialog
        open={confirmOpen}
        title="Excluir produto"
        message={
          toDelete
            ? `Tem certeza que deseja excluir “${toDelete.name}”? Essa ação não pode ser desfeita.`
            : "Tem certeza?"
        }
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={doRemove}
        onCancel={() => {
          setConfirmOpen(false);
          setToDelete(null);
        }}
      />
    </div>
  );
}
