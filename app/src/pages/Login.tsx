import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import logo from '../assets/logo.png';
import '../css/login.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      await login(username.trim(), password);
      navigate('/products');
    } catch {
      setError('Usuario o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <form onSubmit={onSubmit} className="card login-card" aria-busy={loading}>
        <img src={logo} alt="OFFCORSS" className="login-logo" />
        <h1 className="f4 tc mt0 mb4">Hola, inicia sesión</h1>

        <label htmlFor="username" className="db mb2 f6 fw6">Usuario</label>
        <input
          id="username"
          className="input mb3"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          aria-invalid={!!error}
          disabled={loading}
          required
        />

        <label htmlFor="password" className="db mb2 f6 fw6">Contraseña</label>
        <div className="password-field mb3">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            className="input"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!error}
            disabled={loading}
            required
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={showPassword}
          >
            {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </button>
        </div>

        {error && <p role="alert" className="login-error mt0 mb3 f6">{error}</p>}

        <button className="btn btn-accent w-100" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}