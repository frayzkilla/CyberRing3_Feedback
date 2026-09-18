'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '../lib/api';

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      router.push('/requests');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="soviet-form">
      {error && <div className="msg-error">⚠ {error}</div>}

      <div className="form-field">
        <label>Имя пользователя</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Введите имя товарища..."
          required
          autoFocus
        />
      </div>

      <div className="form-field">
        <label>Пароль</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Секретный код доступа..."
          required
        />
      </div>

      <button type="submit" className="btn-soviet" disabled={loading}>
        {loading ? 'Проверка допуска...' : 'Войти в систему'}
      </button>
    </form>
  );
}
