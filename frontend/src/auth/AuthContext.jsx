// frontend/src/auth/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { authCheck } from "../lib/api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const raw = localStorage.getItem("adminAuth");
    return raw ? JSON.parse(raw) : { username: "", password: "", ok: false };
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = async (username, password) => {
    setLoading(true);
    setError("");
    try {
      await authCheck({ username, password });
      const next = { username, password, ok: true };
      setAuth(next);
      localStorage.setItem("adminAuth", JSON.stringify(next));
      return true;
    } catch (err) {
      const status = err?.status ?? err?.response?.status ?? 0;
      const rawMsg = String(err?.message || "");

      let msg = "Não foi possível autenticar.";
      if (status === 401 || /unauthor/i.test(rawMsg)) {
        msg = "Usuário ou senha incorretos.";
      } else if (status === 403 || /forbidden/i.test(rawMsg)) {
        msg = "Você não tem permissão para acessar o painel.";
      } else if (status === 0 || err?.name === "TypeError") {
        msg = "Falha de conexão com o servidor. Verifique se a API está no ar.";
      } else if (status >= 500) {
        msg = "Erro no servidor. Tente novamente em instantes.";
      }

      setError(msg);
      setAuth({ username: "", password: "", ok: false });
      localStorage.removeItem("adminAuth");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setAuth({ username: "", password: "", ok: false });
    localStorage.removeItem("adminAuth");
    setError("");
  };

  useEffect(() => {
    const raw = localStorage.getItem("adminAuth");
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (!saved?.username || !saved?.password) return;
    authCheck(saved).then(
      () => setAuth({ ...saved, ok: true }),
      () => setAuth({ username: "", password: "", ok: false })
    );
  }, []);

  return (
    <AuthCtx.Provider value={{ auth, loading, error, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
