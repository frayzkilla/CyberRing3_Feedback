'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { submitDonos } from '../lib/api';

export default function DonosForm() {
  const [relatives, setRelatives] = useState([{ name: '', delo: '' }]);
  const [distinctiveFeatures, setDistinctiveFeatures] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const addRelative = () => {
    setRelatives([...relatives, { name: '', delo: '' }]);
  };

  const updateRelative = (index, field, value) => {
    const updated = [...relatives];
    updated[index][field] = value;
    setRelatives(updated);
  };

  const removeRelative = (index) => {
    if (relatives.length > 1) {
      setRelatives(relatives.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const body = {};
      relatives.forEach((rel, i) => {
        if (rel.name) {
          body[`relatives[${i + 1}][name]`] = rel.name;
          body[`relatives[${i + 1}][delo]`] = rel.delo;
        }
      });
      body.distinctive_features = distinctiveFeatures;

      await submitDonos(body);
      router.push('/donos/success');
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
        <Link href="/requests/new">Новая заявка</Link>
        <Link href="/donos" className="active nav-danger">Донесение</Link>
      </nav>

      <div className="soviet-panel" style={{ borderColor: 'var(--ah-danger)' }}>
        <h2 style={{ color: 'var(--ah-danger)' }}>Донесение о родственниках</h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--ah-text-dim)', marginBottom: '20px', lineHeight: '1.6' }}>
          Укажите всех родственников и их дела. Бдительность — священный долг
          каждого гражданина Предприятия 3826.
        </p>

        <form onSubmit={handleSubmit} className="soviet-form">
          {error && <div className="msg-error">⚠ {error}</div>}

          {/* Relatives */}
          {relatives.map((rel, index) => (
            <div key={index} className="soviet-panel" style={{ padding: '20px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ margin: 0 }}>Родственник #{index + 1}</h3>
                {relatives.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRelative(index)}
                    style={{
                      background: 'none', border: '1px solid var(--ah-danger)',
                      color: 'var(--ah-danger)', padding: '4px 10px', cursor: 'pointer',
                      fontFamily: 'var(--font-mono)', fontSize: '0.7rem',
                    }}
                  >
                    Удалить
                  </button>
                )}
              </div>

              <div className="form-field">
                <label>Имя</label>
                <input
                  type="text"
                  value={rel.name}
                  onChange={(e) => updateRelative(index, 'name', e.target.value)}
                  placeholder="ФИО родственника..."
                />
              </div>

              <div className="form-field" style={{ marginTop: '10px' }}>
                <label>Дело (досье)</label>
                <textarea
                  value={rel.delo}
                  onChange={(e) => updateRelative(index, 'delo', e.target.value)}
                  placeholder="Описание дела..."
                  style={{ minHeight: '60px' }}
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addRelative}
            className="btn-soviet btn-soviet-secondary"
            style={{ alignSelf: 'flex-start' }}
          >
            + Добавить родственника
          </button>

          <hr className="separator" />

          {/* Distinctive Features */}
          <div className="soviet-panel" style={{ padding: '20px' }}>
            <h3>Особые приметы</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--ah-text-dim)', marginBottom: '12px', lineHeight: '1.6' }}>
              Опишите приметы объекта в формате структурированных данных через точечную нотацию.
              <br />
              Пример: <code style={{ color: 'var(--ah-glow-cyan)' }}>Иванов.рост=высокий&amp;Иванов.волосы=тёмные&amp;Иванов.шрам=левая_щека</code>
            </p>

            <div className="form-field">
              <label>Приметы (ключ=значение, разделитель &amp;)</label>
              <textarea
                value={distinctiveFeatures}
                onChange={(e) => setDistinctiveFeatures(e.target.value)}
                placeholder="Петров.рост=низкий&Петров.борода=да&Петров.хромота=правая_нога"
                style={{ minHeight: '80px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="submit" className="btn-soviet btn-soviet-danger" disabled={loading}>
              {loading ? 'Отправка доноса...' : 'Подать донесение'}
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
