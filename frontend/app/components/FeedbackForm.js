'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { submitFeedback } from '../actions';

export default function FeedbackForm() {
  const [state, formAction, isPending] = useActionState(submitFeedback, null);

  return (
    <div className="fade-in">
      <nav className="soviet-nav">
        <Link href="/requests">Заявки</Link>
        <Link href="/diagnostics">Диагностика</Link>
        <Link href="/loyalty">Лояльность</Link>
        <Link href="/feedback" className="active">Обратная связь</Link>
      </nav>

      {state?.success ? (
        <div className="soviet-panel">
          <div className="success-section" style={{ padding: '30px 0' }}>
            <div className="success-icon">✔</div>
            <h2>Обращение принято</h2>
            <p style={{ color: 'var(--ah-text-dim)' }}>{state.data.message}</p>
            <p style={{
              color: 'var(--ah-glow-cyan)',
              fontFamily: 'var(--font-pixel)',
              fontSize: '0.65rem',
              marginTop: '12px',
            }}>
              Номер обращения: {state.data.ticketId}
            </p>
            <Link href="/feedback" className="btn-soviet" style={{ display: 'inline-block', marginTop: '20px' }}
              onClick={() => window.location.reload()}>
              Новое обращение
            </Link>
          </div>
        </div>
      ) : (
        <div className="soviet-panel">
          <h2>Книга жалоб и предложений</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--ah-text-dim)', marginBottom: '20px', lineHeight: '1.6' }}>
            Каждый трудящийся имеет право обратиться к руководству Предприятия.
            Ваше обращение будет рассмотрено в установленные сроки.
          </p>

          <form action={formAction} className="soviet-form">
            {state?.error && <div className="msg-error">⚠ {state.error}</div>}

            <div className="form-field">
              <label>Категория</label>
              <select name="category" style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.9rem', padding: '12px 16px',
                background: 'var(--ah-dark)', border: '1px solid var(--ah-panel-border)', color: 'var(--ah-text)',
              }}>
                <option value="suggestion">Рационализаторское предложение</option>
                <option value="complaint">Жалоба на условия труда</option>
                <option value="safety">Нарушение техники безопасности</option>
                <option value="supply">Проблемы со снабжением</option>
                <option value="praise">Благодарность руководству</option>
                <option value="other">Иное</option>
              </select>
            </div>

            <div className="form-field">
              <label>Текст обращения</label>
              <textarea name="message" required minLength={10}
                placeholder="Изложите суть обращения подробно и по существу..."
                style={{ minHeight: '140px' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="checkbox" name="anonymous" id="anonymous"
                style={{ width: 'auto', accentColor: 'var(--ussr-red)' }} />
              <label htmlFor="anonymous" style={{
                fontSize: '0.8rem', color: 'var(--ah-text-dim)', textTransform: 'none', letterSpacing: '0',
              }}>
                Анонимное обращение
              </label>
            </div>

            <button type="submit" className="btn-soviet" disabled={isPending}>
              {isPending ? 'Отправка...' : 'Отправить обращение'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
