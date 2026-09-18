'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getRequestById } from '../lib/api';

export default function RequestDetail({ id }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      try {
        const result = await getRequestById(id);
        setData(result.request);
      } catch (err) {
        setError(err.message);
        if (err.message.includes('авторизация')) {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, router]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p className="loading-text">Загрузка заявки из архива...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fade-in">
        <div className="msg-error">⚠ {error}</div>
        <Link href="/requests" className="btn-soviet btn-soviet-secondary" style={{ marginTop: '16px', display: 'inline-block' }}>
          Вернуться к списку
        </Link>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="fade-in">
      <nav className="soviet-nav">
        <Link href="/requests">Заявки</Link>
        <Link href="/requests/new">Новая заявка</Link>
        <Link href="/donos" className="nav-danger">Донесение</Link>
      </nav>

      <div className="soviet-panel">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, border: 'none', paddingBottom: 0 }}>
            Заявка #{data.id}
          </h2>
          <span className={`request-status ${data.status}`} style={{
            fontSize: '0.75rem',
            padding: '5px 14px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            border: '1px solid',
            color: data.status === 'confirmed' ? 'var(--ah-success)' : 'var(--ah-warning)',
            borderColor: data.status === 'confirmed' ? 'var(--ah-success)' : 'var(--ah-warning)',
          }}>
            {data.status === 'confirmed' ? 'Подтверждено' : 'Не подтверждено'}
          </span>
        </div>

        <hr className="separator" />

        {/* Content */}
        <div style={{
          background: 'var(--ah-dark)',
          border: '1px solid var(--ah-panel-border)',
          borderLeft: '3px solid var(--ussr-red)',
          padding: '20px',
          marginBottom: '24px',
          lineHeight: '1.8',
          fontSize: '0.95rem',
        }}>
          {data.content}
        </div>

        {/* Metadata */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          background: 'var(--ah-dark)',
          border: '1px solid var(--ah-panel-border)',
          padding: '16px',
        }}>
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--ah-text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Номер заявки
            </span>
            <p style={{ color: 'var(--ah-glow-cyan)', fontFamily: 'var(--font-pixel)', fontSize: '0.7rem', marginTop: '4px' }}>
              #{data.id}
            </p>
          </div>
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--ah-text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Заявитель
            </span>
            <p style={{ color: 'var(--ussr-gold)', fontSize: '0.85rem', marginTop: '4px' }}>
              {data.username}
            </p>
          </div>
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--ah-text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Дата подачи
            </span>
            <p style={{ color: 'var(--ah-text)', fontSize: '0.85rem', marginTop: '4px' }}>
              {new Date(data.created_at).toLocaleString('ru-RU')}
            </p>
          </div>
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--ah-text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              ID пользователя
            </span>
            <p style={{ color: 'var(--ah-text)', fontSize: '0.85rem', marginTop: '4px' }}>
              {data.user_id}
            </p>
          </div>
        </div>
      </div>

      {/* Back button */}
      <div style={{ marginTop: '20px' }}>
        <Link href="/requests" className="btn-soviet btn-soviet-secondary">
          Вернуться к списку заявок
        </Link>
      </div>

      <div className="propaganda-text" style={{ marginTop: '30px' }}>
        Каждая заявка — вклад в выполнение Плана
      </div>
    </div>
  );
}
