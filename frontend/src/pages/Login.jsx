import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { GoEye, GoEyeClosed, GoLock, GoPerson } from "react-icons/go";

export default function Login() {
  const { login, error } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(form.username.trim(), form.password);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        /* Fundo no estilo do site */
        background:
          "linear-gradient(180deg, #fff 0%, #fff 50%, #fff 60%)",
      }}
    >
      {/* camadas de cor (radiais) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          backgroundImage: `
            radial-gradient(1200px 700px at 12% 18%, var(--azul) 0 35%, transparent 36%),
            radial-gradient(1000px 700px at 86% 22%, var(--ciano) 0 35%, transparent 36%),
            radial-gradient(1100px 680px at 12% 88%, var(--amarelo) 0 38%, transparent 39%),
            radial-gradient(900px 640px at 88% 84%, var(--rosa) 0 34%, transparent 35%)
          `,
          opacity: 0.22,
        }}
      />

      <div
        className="w-full max-w-md rounded-2xl border border-black/10 shadow-[0_18px_50px_rgba(0,0,0,.18)] bg-white/80 backdrop-blur p-6"
      >
        <h1 className="text-xl font-semibold text-slate-900 mb-4">
          Entrar
        </h1>

        <form onSubmit={submit} className="grid gap-3">
          <label className="text-xs text-slate-600">Usuário</label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-slate-500">
              <GoPerson />
            </span>
            <input
              name="username"
              value={form.username}
              onChange={onChange}
              placeholder="Usuário"
              className="w-full rounded-lg border border-black/10 pl-9 pr-3 py-2 outline-none focus:border-slate-400"
              autoFocus
              autoComplete="username"
            />
          </div>

          <label className="text-xs text-slate-600 mt-2">Senha</label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-slate-500">
              <GoLock />
            </span>
            <input
              name="password"
              type={show ? "text" : "password"}
              value={form.password}
              onChange={onChange}
              placeholder="Senha"
              className="w-full rounded-lg border border-black/10 pl-9 pr-10 py-2 outline-none focus:border-slate-400"
              autoComplete="current-password"
            />
            <button
              type="button"
              className="absolute right-3 top-2.5 text-slate-600 hover:text-slate-800"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "Ocultar senha" : "Mostrar senha"}
            >
              {show ? <GoEyeClosed /> : <GoEye />}
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-700 mt-1">
              {String(error)}
            </p>
          )}

          <button
            disabled={submitting}
            className="mt-3 w-full rounded-lg text-white py-2 font-medium shadow hover:opacity-95 disabled:opacity-60"
            style={{
              background: "linear-gradient(90deg, var(--laranja), var(--rosa))",
            }}
          >
            {submitting ? "Entrando…" : "Entrar"}
          </button>

          <p className="text-[11px] text-slate-500 mt-2">
            Acesso restrito ao administrador.
          </p>
        </form>
      </div>
    </div>
  );
}
