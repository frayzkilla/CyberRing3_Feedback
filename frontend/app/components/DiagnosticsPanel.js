'use client';

import { useActionState } from 'react';
import { runDiagnostics } from '../actions';

const SUBSYSTEMS = [
  { id: 'reactor', name: 'Реактор «Коллектив-1»', icon: '⚛' },
  { id: 'polymer', name: 'Полимерный цех П-3', icon: '🧪' },
  { id: 'robotics', name: 'Цех робототехники Р-7', icon: '🤖' },
  { id: 'security', name: 'Периметр безопасности', icon: '🛡' },
  { id: 'network', name: 'Сеть «Коллектив 2.0»', icon: '🌐' },
];

export default function DiagnosticsPanel() {
  const [state, formAction, isPending] = useActionState(runDiagnostics, null);

  return (
    <div className="soviet-panel fade-in">
      <h2>Проверка подсистемы</h2>
      <p style={{ fontSize: '0.8rem', color: 'var(--ah-text-dim)', marginBottom: '20px' }}>
        Выберите подсистему для проведения диагностики. Результаты обрабатываются
        центральным сервером Предприятия.
      </p>

      <form action={formAction} className="soviet-form">
        <div className="form-field">
          <label>Подсистема</label>
          <select name="subsystem" required style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.9rem',
            padding: '12px 16px',
            background: 'var(--ah-dark)',
            border: '1px solid var(--ah-panel-border)',
            color: 'var(--ah-text)',
          }}>
            {SUBSYSTEMS.map(s => (
              <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
            ))}
          </select>
        </div>

        <button type="submit" className="btn-soviet" disabled={isPending}>
          {isPending ? 'Сканирование подсистемы...' : 'Запустить диагностику'}
        </button>
      </form>

      {/* Results */}
      {state?.error && (
        <div className="msg-error" style={{ marginTop: '20px' }}>⚠ {state.error}</div>
      )}

      {state?.success && state.data && (
        <div style={{ marginTop: '24px' }}>
          <hr className="separator" />
          <h3 style={{ color: 'var(--ussr-gold)', marginBottom: '16px' }}>
            Результат: {state.data.name}
          </h3>

          <div style={{
            background: 'var(--ah-dark)',
            border: '1px solid var(--ah-panel-border)',
            padding: '20px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '12px',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--ah-panel-border)',
            }}>
              <span>СТАТУС</span>
              <span style={{
                color: state.data.status === 'НОРМА' ? 'var(--ah-success)' : 'var(--ah-warning)',
                fontFamily: 'var(--font-pixel)',
                fontSize: '0.65rem',
              }}>
                [ {state.data.status} ]
              </span>
            </div>

            {Object.entries(state.data).filter(([k]) =>
              !['name', 'status', 'checkedAt', 'checkedBy'].includes(k)
            ).map(([key, value]) => (
              <div key={key} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '6px 0',
                borderBottom: '1px solid rgba(42,42,58,0.5)',
              }}>
                <span style={{ color: 'var(--ah-text-dim)' }}>{key}</span>
                <span style={{ color: 'var(--ah-glow-cyan)' }}>{String(value)}</span>
              </div>
            ))}

            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--ah-panel-border)', color: 'var(--ah-text-dim)', fontSize: '0.7rem' }}>
              Проверено: {new Date(state.data.checkedAt).toLocaleString('ru-RU')}
              <br />
              Оператор: {state.data.checkedBy}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
