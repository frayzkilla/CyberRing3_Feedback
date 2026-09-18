import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="fade-in">
      <div className="hero-section">
        <div className="hero-star">☭</div>
        <h1>Предприятие 3826</h1>
        <p className="hero-subtitle">Портал Распределения Ресурсов</p>
        <p className="hero-facility">[ СИСТЕМА «КОЛЛЕКТИВ 2.0» — АКТИВНА ]</p>

        <p className="hero-quote">
          Каждый винтик великой машины важен. Подайте заявку на ресурсы —
          и Предприятие обеспечит всем необходимым для выполнения Плана.
        </p>

        <div className="hero-buttons">
          <Link href="/login" className="btn-soviet">
            Войти в систему
          </Link>
          <Link href="/register" className="btn-soviet btn-soviet-secondary">
            Регистрация
          </Link>
        </div>
      </div>

      <hr className="separator" />

      <div className="propaganda-text">
        Труд — дело чести, дело славы, дело доблести и геройства
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginTop: '30px' }}>
        <Link href="/requests" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="soviet-panel">
            <h3>★ Заявки на ресурсы</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--ah-text-dim)', lineHeight: '1.6' }}>
              Оформите запрос на необходимые материалы, оборудование и кадры
              для выполнения производственного плана.
            </p>
          </div>
        </Link>
        <Link href="/diagnostics" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="soviet-panel">
            <h3>⚛ Диагностика систем</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--ah-text-dim)', lineHeight: '1.6' }}>
              Мониторинг подсистем Предприятия: реактор, полимерный цех,
              робототехника, периметр безопасности.
            </p>
          </div>
        </Link>
        <Link href="/loyalty" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="soviet-panel">
            <h3>★ Проверка лояльности</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--ah-text-dim)', lineHeight: '1.6' }}>
              Оценка политической благонадёжности сотрудников.
              Отдел кадров Предприятия 3826.
            </p>
          </div>
        </Link>
        <Link href="/feedback" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="soviet-panel">
            <h3>★ Обратная связь</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--ah-text-dim)', lineHeight: '1.6' }}>
              Книга жалоб и предложений. Каждый трудящийся имеет право
              обратиться к руководству.
            </p>
          </div>
        </Link>
        <Link href="/donos" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="soviet-panel" style={{ borderColor: 'var(--ah-danger)' }}>
            <h3 style={{ color: 'var(--ah-danger)' }}>★ Донесения</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--ah-text-dim)', lineHeight: '1.6' }}>
              Сообщите о нарушениях и подозрительной деятельности.
              Бдительность — долг каждого гражданина.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
