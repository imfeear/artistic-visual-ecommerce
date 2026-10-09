// frontend/src/auth/AuthContext.jsx
import { useEffect, useState } from 'react';
import { authCheck } from '../lib/api';
import { AuthCtx, emptyAuth, readAuth } from './authStore';

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readAuth);
  const [loading, setLoading] = useState(() => Boolean(readAuth()?.username));
  const [error, setError] = useState('');

  const login = async (username, password) => {
    setLoading(true);
    setError('');
    try {
      await authCheck({ username, password });
      const next = { username, password, ok: true };
      setAuth(next);
      localStorage.setItem('adminAuth', JSON.stringify(next));
      return true;
    } catch (err) {
      const status = err?.status ?? err?.response?.status ?? 0;
      const rawMsg = String(err?.message || '');

      let msg = 'Não foi possível autenticar.';
      if (status === 401 || /unauthor/i.test(rawMsg)) {
        msg = 'Usuário ou senha incorretos.';
      } else if (status === 403 || /forbidden/i.test(rawMsg)) {
        msg = 'Você não tem permissão para acessar o painel.';
      } else if (status === 0 || err?.name === 'TypeError') {
        msg = 'Falha de conexão com o servidor. Verifique se a API está no ar.';
      } else if (status >= 500) {
        msg = 'Erro no servidor. Tente novamente em instantes.';
      }

      setError(msg);
      setAuth({ username: '', password: '', ok: false });
      localStorage.removeItem('adminAuth');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setAuth({ username: '', password: '', ok: false });
    localStorage.removeItem('adminAuth');
    setError('');
  };

  useEffect(() => {
    const saved = readAuth();
    if (!saved?.username || !saved?.password) {
      setLoading(false);
      return;
    }
    let active = true;
    authCheck(saved)
      .then(
        () => {
          if (active) setAuth({ ...saved, ok: true });
        },
        () => {
          if (active) {
            setAuth(emptyAuth);
            localStorage.removeItem('adminAuth');
          }
        },
      )
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <AuthCtx.Provider value={{ auth, loading, error, login, logout }}>{children}</AuthCtx.Provider>
  );
}
