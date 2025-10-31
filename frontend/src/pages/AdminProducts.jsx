import { useEffect, useState, useMemo, useRef } from "react";
import CarouselModal from "../components/CarouselModal";
import {
  createProduct,
  getTrackSummary,
  updateProduct,
  deleteProduct,
  listProducts,
  uploadImage,
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
import { gsap } from "gsap";
import logo from "../assets/logo.png";

function prettyLabel(meta) {
  if (!meta) return "Outro";
  if (meta === "whatsapp_button") return "Botão WhatsApp";
  if (meta === "nav_loja") return "Menu: Loja";
  if (meta === "nav_destaques") return "Menu: Destaques";
  if (meta === "nav_contato") return "Menu: Contato";
  if (meta === "hero_arrow_left") return "Carrossel: Anterior";
  if (meta === "hero_arrow_right") return "Carrossel: Próximo";
  if (meta?.startsWith("hero_dot_")) return `Carrossel: Dot ${meta.replace("hero_dot_", "")}`;
  if (meta?.startsWith("search:")) return `Busca: “${meta.slice(7)}”`;
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

function LegendPills({ payload = [] }) {
  return (
    <div className="flex flex-wrap gap-2 gap-y-3 justify-center mt-4" style={{ lineHeight: "1.1" }}>
      {payload.map((entry, idx) => (
        <span
          key={idx}
          className="px-2 py-1 rounded-full text-xs"
          style={{
            border: `1px solid ${entry.color}55`,
            background: `${entry.color}14`,
            color: "#0f172a",
          }}
          title={entry.value}
        >
          <span
            className="inline-block w-2 h-2 rounded-full mr-1 align-middle"
            style={{ background: entry.color }}
          />
          {entry.value}
        </span>
      ))}
    </div>
  );
}

export default function AdminProducts() {
  const { auth, logout } = useAuth();

  // Navbar (logo + animações — com refs)
  const headerRef = useRef(null);
  const logoRef = useRef(null);
  const logoutBtnRef = useRef(null);

  // animação de entrada com cleanup
      useEffect(() => {
      const ctx = gsap.context(() => {
        if (!logoRef.current || !logoutBtnRef.current) return;

        // não limpar todas as props; preserva height/width
        gsap.set([logoRef.current, logoutBtnRef.current], { opacity: 1, y: 0 });

        gsap.from(logoRef.current, {
          y: -14,
          opacity: 0,
          duration: 0.45,
          ease: "power3.out",
          onComplete: () => gsap.set(logoRef.current, { clearProps: "transform,opacity" }),
        });

        gsap.from(logoutBtnRef.current, {
          y: -10,
          opacity: 0,
          duration: 0.35,
          delay: 0.06,
          ease: "power2.out",
          onComplete: () => gsap.set(logoutBtnRef.current, { clearProps: "transform,opacity" }),
        });
      }, headerRef);

      return () => ctx.revert();
    }, []);

  // mudança de cor do header na rolagem (com cleanup)
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const apply = () => {
      const y =
        window.scrollY ??
        window.pageYOffset ??
        document.documentElement.scrollTop ??
        0;
      header.classList.toggle("rolagem", y > 0);
    };

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        apply();
        ticking = false;
      });
    };

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });

    const sentinel = document.getElementById("nav-sentinel-admin");
    let io;
    if (sentinel && "IntersectionObserver" in window) {
      io = new IntersectionObserver(
        ([entry]) => header.classList.toggle("rolagem", !entry.isIntersecting),
        { root: null, threshold: 0 }
      );
      io.observe(sentinel);
    }
    return () => {
      window.removeEventListener("scroll", onScroll);
      io?.disconnect();
    };
  }, []);

  // modal do carrossel
  const [carouselOpen, setCarouselOpen] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    available: true,
  });
  const [uploading, setUploading] = useState(false);
  const [pickedName, setPickedName] = useState("");
  const [status, setStatus] = useState("");

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((s) => ({ ...s, [name]: type === "checkbox" ? checked : value }));
  };

  const onPickFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPickedName(file.name);
    setUploading(true);
    try {
      const up = await uploadImage(file, auth);
      setForm((s) => ({ ...s, imageUrl: up.url }));
      setStatus("");
    } catch (err) {
      setStatus(`Erro no upload: ${String(err.message)}`);
    } finally {
      setUploading(false);
    }
  };

  const removePicked = () => {
    setPickedName("");
    setForm((s) => ({ ...s, imageUrl: "" }));
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
      setForm({ name: "", description: "", price: "", imageUrl: "", available: true });
      setPickedName("");
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

  const [products, setProducts] = useState([]);
  const [editId, setEditId] = useState(null);
  const [row, setRow] = useState({ name: "", price: "", available: true });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);

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

  const cancelEdit = () => setEditId(null);

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
      {/* NAVBAR */}
      <header ref={headerRef} id="admin-header" className="navbar">
        <div className="mx-auto max-w-6xl px-3 md:px-4 nav-inner">
          <div className="flex items-center gap-3">
            <img
              ref={logoRef}
              src={logo}
              alt="Recife Art"
              className="select-none shrink-0"
              style={{ height: 36, width: 36, objectFit: "contain", borderRadius: 18 }}
            />
            <h1 className="text-white text-lg md:text-xl font-semibold tracking-tight">
              Painel de Produtos
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              ref={logoutBtnRef}
              data-logout
              onClick={logout}
              className="text-white text-[13px] md:text-sm px-3 py-1.5 rounded-full border border-white/70 hover:bg-white/10 transition"
              title="Sair do painel"
            >
              Encerrar sessão
            </button>
          </div>
        </div>
      </header>
      <div id="nav-sentinel-admin" className="nav-spacer" />

      <div className="p-6 mx-auto max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_minmax(440px,520px)]">
          <div className="space-y-6">
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

                <div className="space-y-3">
                  <div className="text-xs text-slate-600">ou</div>

                  <div className="rounded-lg border border-black/10 p-3 bg-white/70">
                    <input id="file-input" type="file" accept="image/*" onChange={onPickFile} className="sr-only" />
                    <label
                      htmlFor="file-input"
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-black/20 bg-white hover:bg-slate-50 text-sm font-medium shadow-sm cursor-pointer"
                    >
                      Escolher arquivo
                    </label>

                    {pickedName && <span className="ml-3 text-sm text-slate-700">{pickedName}</span>}

                    {form.imageUrl && (
                      <div className="mt-3 flex items-center gap-2">
                        <img
                          src={form.imageUrl}
                          alt="Pré-visualização"
                          className="h-10 w-10 rounded object-cover border border-black/10"
                        />
                        <a
                          href={form.imageUrl}
                          className="text-xs underline text-slate-700"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Abrir imagem
                        </a>
                        <button
                          type="button"
                          onClick={removePicked}
                          className="text-xs px-2 py-1 rounded border border-black/20"
                          title="Remover imagem"
                        >
                          Remover
                        </button>
                      </div>
                    )}

                    {uploading && <div className="mt-2 text-xs text-slate-600">Enviando imagem…</div>}
                  </div>
                </div>

                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" name="available" checked={form.available} onChange={onChange} />
                  Disponível para venda
                </label>

                <button
                  className="px-4 py-2 rounded-lg text-white font-medium shadow hover:opacity-95"
                  style={{ background: "linear-gradient(90deg, var(--laranja), var(--rosa))" }}
                >
                  Criar produto
                </button>
              </form>

              {status && <p className="mt-4 text-sm">{status}</p>}
            </div>

            <div className="rounded-2xl border border-black/10 bg-white/90 backdrop-blur p-5 shadow-[0_10px_24px_rgba(0,0,0,.12)]">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Produtos cadastrados</h2>
                <button
                  onClick={loadProducts}
                  className="text-sm px-3 py-1 rounded text-white"
                  style={{ background: "linear-gradient(90deg, var(--ciano), var(--azul))" }}
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

                        <td className="py-2 pr-4">
                          {editId === p.id ? (
                            <input
                              className="border rounded px-2 py-1 w-full"
                              value={row.name}
                              onChange={(e) => setRow((s) => ({ ...s, name: e.target.value }))}
                            />
                          ) : (
                            <span>{p.name}</span>
                          )}
                        </td>

                        <td className="py-2 pr-4">
                          {editId === p.id ? (
                            <input
                              type="number"
                              step="0.01"
                              className="border rounded px-2 py-1 w-28"
                              value={row.price}
                              onChange={(e) => setRow((s) => ({ ...s, price: e.target.value }))}
                            />
                          ) : (
                            <span>R$ {Number(p.price ?? 0).toFixed(2)}</span>
                          )}
                        </td>

                        <td className="py-2 pr-4">
                          {editId === p.id ? (
                            <input
                              type="checkbox"
                              checked={!!row.available}
                              onChange={(e) => setRow((s) => ({ ...s, available: e.target.checked }))}
                            />
                          ) : p.available ? (
                            "Sim"
                          ) : (
                            "Não"
                          )}
                        </td>

                        <td className="py-2 pr-4">
                          {editId === p.id ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => saveEdit(p.id)}
                                className="text-white text-xs px-3 py-1 rounded"
                                style={{ background: "linear-gradient(90deg, var(--ciano), var(--azul))" }}
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
                                style={{ background: "linear-gradient(90deg, var(--ciano), var(--azul))" }}
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
                        <td colSpan={5} className="py-6 text-center text-slate-600">
                          Nenhum produto cadastrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

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
                style={{ background: "linear-gradient(90deg, var(--ciano), var(--azul))" }}
              >
                Atualizar
              </button>

              <button
                type="button"
                onClick={() => setCarouselOpen(true)}
                className="px-3 py-1 rounded border text-sm bg-white/80"
                title="Editar imagens do carrossel"
              >
                Editar carrossel
              </button>
            </div>

            {errStats && <p className="text-red-700 text-sm mb-2">Erro: {errStats}</p>}

            <div className="grid sm:grid-cols-3 gap-3 mb-4">
              <div className="rounded-xl border border-black/10 bg-white/90 p-3">
                <div className="text-xs text-slate-600">Pageviews</div>
                <div className="text-2xl font-bold">{loadingStats ? "…" : byType.PAGEVIEW ?? 0}</div>
              </div>
              <div className="rounded-xl border border-black/10 bg-white/90 p-3">
                <div className="text-xs text-slate-600">Cliques</div>
                <div className="text-2xl font-bold">{loadingStats ? "…" : byType.CLICK ?? 0}</div>
              </div>
              <div className="rounded-xl border border-black/10 bg-white/90 p-3">
                <div className="text-xs text-slate-600">Visitantes únicos</div>
                <div className="text-2xl font-bold">{loadingStats ? "…" : summary?.uniqueIps ?? 0}</div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-xl border border-black/10 bg-white/90 p-3">
                <h3 className="font-semibold mb-2">Top cliques</h3>

                <div style={{ width: "100%", height: 280 }}>
                  <ResponsiveContainer>
                    <PieChart margin={{ top: 10, right: 16, bottom: 0, left: 16 }}>
                      <Pie
                        dataKey="count"
                        nameKey="label"
                        data={top}
                        cx="50%"
                        cy="42%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        labelLine={false}
                        label={({ cx, cy, midAngle, outerRadius, percent }) => {
                          if (!percent || percent < 0.08) return null;
                          const RAD = Math.PI / 180;
                          const r = outerRadius + 10;
                          const x = cx + r * Math.cos(-midAngle * RAD);
                          const y = cy + r * Math.sin(-midAngle * RAD);
                          return (
                            <text
                              x={x}
                              y={y}
                              fill="#0f172a"
                              fontSize={12}
                              fontWeight={600}
                              textAnchor={x > cx ? "start" : "end"}
                              dominantBaseline="central"
                            >
                              {`${Math.round(percent * 100)}%`}
                            </text>
                          );
                        }}
                      >
                        {top.map((_, idx) => (
                          <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => [`${v}`, "Cliques"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <LegendPills
                  payload={top.map((t, idx) => ({
                    value: t.label,
                    color: COLORS[idx % COLORS.length],
                  }))}
                />

                {!loadingStats && top.length === 0 && (
                  <p className="text-sm text-slate-600 mt-2">Sem dados</p>
                )}
              </div>

              <div className="rounded-xl border border-black/10 bg-white/90 p-3">
                <h3 className="font-semibold mb-2">Pageviews por dia</h3>
                <div style={{ width: "100%", height: 240 }}>
                  <ResponsiveContainer>
                    <BarChart data={pv} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" name="Pageviews" fill="#06B6D4" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {!loadingStats && pv.length === 0 && <p className="text-sm text-slate-600">Sem dados</p>}
              </div>
            </div>
          </aside>
        </div>
      </div>

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

      {/* Modal do carrossel */}
      <CarouselModal open={carouselOpen} onClose={() => setCarouselOpen(false)} />
    </div>
  );
}
