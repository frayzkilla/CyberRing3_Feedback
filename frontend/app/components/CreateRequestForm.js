'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createRequest } from '../lib/api';

export default function CreateRequestForm() {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await createRequest(content);
      router.push('/requests');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <nav className="soviet-nav">
        <Link href="/requests">Заявки</Link>
        <Link href="/requests/new" className="active">Новая заявка</Link>
        <Link href="/donos" className="nav-danger">Донесение</Link>
      </nav>

      <div className="soviet-panel">
        <h2>Новая ресурсная заявка</h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--ah-text-dim)', marginBottom: '20px' }}>
          Опишите необходимые ресурсы для выполнения производственного плана.
          Заявка будет направлена на рассмотрение супервайзеру.
        </p>

        <form onSubmit={handleSubmit} className="soviet-form">
          {error && <div className="msg-error">⚠ {error}</div>}

          <div className="form-field">
            <label>Содержание заявки</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Требуется 50 кг муки для столовой цеха №7... / Запрос на выделение 3 грузовиков для доставки продовольствия в колхоз..."
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="submit" className="btn-soviet" disabled={loading}>
              {loading ? 'Отправка...' : 'Подать заявку'}
            </button>
            <Link href="/requests" className="btn-soviet btn-soviet-secondary">
              Отмена
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
