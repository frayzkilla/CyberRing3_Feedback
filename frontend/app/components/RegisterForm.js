'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { register } from '../lib/api';

export default function RegisterForm() {
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
      await register(username, password);
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
          placeholder="Присвоенный идентификатор..."
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
          placeholder="Придумайте код доступа..."
          required
        />
      </div>

      <button type="submit" className="btn-soviet" disabled={loading}>
        {loading ? 'Оформление допуска...' : 'Зарегистрироваться'}
      </button>
    </form>
  );
}
