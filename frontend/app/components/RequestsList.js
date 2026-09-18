'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getRequests, logout as apiLogout } from '../lib/api';

export default function RequestsList() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const result = await getRequests();
      setData(result);
    } catch (err) {
      setError(err.message);
      if (err.message.includes('авторизация') || err.message.includes('401')) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch (_) {}
    router.push('/');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p className="loading-text">Загрузка данных из архива...</p>
      </div>
    );
  }

  if (error) {
    return <div className="msg-error">⚠ {error}</div>;
  }

  if (!data) return null;

  const { requests, isSupervisor, username } = data;

  return (
    <div className="fade-in">
      {/* User info bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <span style={{ color: 'var(--ah-text-dim)', fontSize: '0.8rem', marginRight: '10px' }}>
            Товарищ <strong style={{ color: 'var(--ussr-gold)' }}>{username}</strong>
          </span>
          {isSupervisor ? (
            <span className="supervisor-badge">Супервайзер</span>
          ) : (
            <span className="user-badge">Рабочий</span>
          )}
        </div>
        <button onClick={handleLogout} className="btn-soviet btn-soviet-secondary" style={{ padding: '6px 14px', fontSize: '0.7rem' }}>
          Выйти
        </button>
      </div>

      {/* Navigation */}
      <nav className="soviet-nav">
        <Link href="/requests" className="active">Заявки</Link>
        <Link href="/requests/new">Новая заявка</Link>
        <Link href="/donos" className="nav-danger">Донесение</Link>
      </nav>

      {/* Requests count */}
      <div style={{ marginBottom: '20px', fontSize: '0.8rem', color: 'var(--ah-text-dim)' }}>
        {isSupervisor ? (
          <span>Все заявки предприятия — <strong style={{ color: 'var(--ah-glow-cyan)' }}>{requests.length}</strong> записей</span>
        ) : (
          <span>Ваши заявки — <strong style={{ color: 'var(--ussr-gold)' }}>{requests.length}</strong> записей</span>
        )}
      </div>

      {/* Requests list */}
      {requests.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <p>Заявки не обнаружены в архиве</p>
          <Link href="/requests/new" className="btn-soviet" style={{ marginTop: '20px', display: 'inline-block' }}>
            Создать первую заявку
          </Link>
        </div>
      ) : (
        <div>
          {requests.map((req) => (
            <Link key={req.id} href={`/requests/${req.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="request-card" style={{ cursor: 'pointer' }}>
                <div className="request-header">
                  <span className="request-id">Заявка #{req.id}</span>
                  <span className={`request-status ${req.status}`}>
                    {req.status === 'confirmed' ? 'Подтверждено' : 'Не подтверждено'}
                  </span>
                </div>
                <div className="request-content">{req.content}</div>
                <div className="request-meta">
                  <span>Дата: {new Date(req.created_at).toLocaleString('ru-RU')}</span>
                  {isSupervisor && req.username && (
                    <span className="request-user">Заявитель: {req.username}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
