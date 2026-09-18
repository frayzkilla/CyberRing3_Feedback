'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { submitLoyaltyReport } from '../actions';

export default function LoyaltyForm() {
  const [state, formAction, isPending] = useActionState(submitLoyaltyReport, null);

  return (
    <div className="fade-in">
      <nav className="soviet-nav">
        <Link href="/requests">Заявки</Link>
        <Link href="/diagnostics">Диагностика</Link>
        <Link href="/loyalty" className="active">Лояльность</Link>
        <Link href="/feedback">Обратная связь</Link>
      </nav>

      {state?.success ? (
        <div className="soviet-panel">
          <div className="success-section" style={{ padding: '30px 0' }}>
            <div className="success-icon">✔</div>
            <h2>Отчёт зарегистрирован</h2>

            <div style={{
              background: 'var(--ah-dark)',
              border: '1px solid var(--ah-panel-border)',
              padding: '20px',
              margin: '20px auto',
              maxWidth: '400px',
              textAlign: 'left',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
            }}>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: 'var(--ah-text-dim)' }}>Номер: </span>
                <span style={{ color: 'var(--ah-glow-cyan)' }}>{state.data.registrationId}</span>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: 'var(--ah-text-dim)' }}>Товарищ: </span>
                <span>{state.data.name}</span>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: 'var(--ah-text-dim)' }}>Отдел: </span>
                <span>{state.data.department}</span>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: 'var(--ah-text-dim)' }}>Балл: </span>
                <span style={{ color: 'var(--ussr-gold)' }}>{state.data.score}/100</span>
              </div>
              <div style={{
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: '1px solid var(--ah-panel-border)',
                textAlign: 'center',
              }}>
                <span style={{
                  color: state.data.score >= 70 ? 'var(--ah-success)' : 'var(--ah-warning)',
                  fontFamily: 'var(--font-pixel)',
                  fontSize: '0.6rem',
                  letterSpacing: '1px',
                }}>
                  [ {state.data.classification} ]
                </span>
              </div>
            </div>

            <Link href="/loyalty" className="btn-soviet" style={{ display: 'inline-block', marginTop: '16px' }}
              onClick={() => window.location.reload()}>
              Новый отчёт
            </Link>
          </div>
        </div>
      ) : (
        <div className="soviet-panel">
          <h2>Отчёт о лояльности сотрудника</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--ah-text-dim)', marginBottom: '20px', lineHeight: '1.6' }}>
            Заполните форму оценки политической благонадёжности сотрудника.
            Данные обрабатываются центральным сервером и передаются в отдел кадров.
          </p>

          <form action={formAction} className="soviet-form">
            {state?.error && <div className="msg-error">⚠ {state.error}</div>}

            <div className="form-field">
              <label>ФИО сотрудника</label>
              <input type="text" name="name" placeholder="Иванов Иван Иванович" required />
            </div>

            <div className="form-field">
              <label>Отдел / Цех</label>
              <select name="department" required style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.9rem', padding: '12px 16px',
                background: 'var(--ah-dark)', border: '1px solid var(--ah-panel-border)', color: 'var(--ah-text)',
              }}>
                <option value="">Выберите подразделение...</option>
                <option value="Цех робототехники Р-7">Цех робототехники Р-7</option>
                <option value="Полимерный цех П-3">Полимерный цех П-3</option>
                <option value="Реакторный отдел">Реакторный отдел</option>
                <option value="Отдел безопасности">Отдел безопасности</option>
                <option value="Лаборатория «Вавилов»">Лаборатория «Вавилов»</option>
                <option value="Управление">Управление</option>
                <option value="Столовая">Столовая</option>
              </select>
            </div>

            <div className="form-field">
              <label>Оценка лояльности (0–100)</label>
              <input type="number" name="loyaltyScore" min="0" max="100" defaultValue="75"
                style={{ maxWidth: '200px' }} />
            </div>

            <div className="form-field">
              <label>Дополнительные сведения</label>
              <textarea name="report" placeholder="Характеристика поведения, участие в партийной жизни, замечания..."
                style={{ minHeight: '100px' }} />
            </div>

            <button type="submit" className="btn-soviet" disabled={isPending}>
              {isPending ? 'Обработка отчёта...' : 'Отправить отчёт'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
