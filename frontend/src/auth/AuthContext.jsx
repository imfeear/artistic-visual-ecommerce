import { createContext, useContext, useEffect, useState } from "react";
import { authCheck } from "../lib/api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const raw = localStorage.getItem("adminAuth");
    return raw ? JSON.parse(raw) : { username: "", password: "", ok: false };
  });
  const [loading, setLoading] = useState(false);

  const login = async (username, password) => {
    setLoading(true);
    try {
      await authCheck({ username, password });
      const next = { username, password, ok: true };
      setAuth(next);
      localStorage.setItem("adminAuth", JSON.stringify(next));
      return true;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setAuth({ username: "", password: "", ok: false });
    localStorage.removeItem("adminAuth");
  };

  //opcional: validar ao carregar (silencioso)
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
    <AuthCtx.Provider value={{ auth, loading, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
