import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiArrowRight, FiEye, FiEyeOff, FiLock, FiUser } from 'react-icons/fi';
import { useAuth } from '../auth/useAuth';
import { Brand } from '../components/StoreLayout';
import { Badge, Button } from '../components/ui';

export default function Login() {
  const { login, error, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;
  const destination = from ? `${from.pathname}${from.search || ''}` : '/admin';
  const [form, setForm] = useState({ username: '', password: '' });
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const change = (e) => setForm((s) => ({ ...s, [e.target.name]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (await login(form.username.trim(), form.password))
        navigate(destination, { replace: true });
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div className="studio-login">
      <section className="login-campaign">
        <Brand light />
        <img
          src="/images/pernambuco-editorial.webp"
          alt="Composição artística original inspirada nas tradições de Pernambuco"
        />
        <div className="login-campaign-copy">
          <p className="eyebrow">ALDO SALES / ESTÚDIO</p>
          <h2>
            O talento é seu.
            <br />
            <em>O mundo é o destino.</em>
          </h2>
          <p>
            Um espaço para cuidar da sua arte
            <br />e de todos os encontros que ela provoca.
          </p>
        </div>
        <span className="login-campaign-footer">ORIGEM É O NOSSO PONTO DE PARTIDA.</span>
      </section>
      <main className="login-form-section">
        <Link to="/" className="text-link login-return">
          <FiArrowLeft /> Voltar para a loja
        </Link>
        <div className="login-form-card">
          <Badge tone="purple">
            <FiLock /> ÁREA ADMINISTRATIVA
          </Badge>
          <h1>
            Bom ter
            <br />
            você por aqui.
          </h1>
          <p>Entre no seu estúdio e dê vida à sua coleção.</p>
          <form onSubmit={submit}>
            <label className="field" htmlFor="username">
              Usuário
              <div className="input-icon">
                <FiUser />
                <input
                  id="username"
                  name="username"
                  value={form.username}
                  onChange={change}
                  autoComplete="username"
                  placeholder="Seu usuário"
                  required
                  autoFocus
                />
              </div>
            </label>
            <label className="field" htmlFor="password">
              Senha
              <div className="input-icon">
                <FiLock />
                <input
                  id="password"
                  name="password"
                  type={show ? 'text' : 'password'}
                  value={form.password}
                  onChange={change}
                  autoComplete="current-password"
                  placeholder="Sua senha"
                  required
                />
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {show ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <Button
              type="submit"
              busy={submitting || loading}
              disabled={!form.username.trim() || !form.password}
            >
              Entrar no estúdio <FiArrowRight />
            </Button>
          </form>
          <p className="login-restriction">
            <FiLock /> Acesso restrito ao administrador.
          </p>
        </div>
        <footer>Aldo Sales · Feito de cultura. Feito para ficar.</footer>
      </main>
    </div>
  );
}
