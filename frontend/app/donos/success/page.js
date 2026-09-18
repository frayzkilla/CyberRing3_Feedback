import Link from "next/link";
import SovietHeader from "../../components/SovietHeader";

export default function DonosSuccessPage() {
  return (
    <div className="fade-in">
      <SovietHeader
        title="Донесение принято"
        subtitle="Отдел внутренней безопасности"
      />

      <div className="success-section">
        <div className="success-icon">✔</div>
        <h2>Донесение успешно принято</h2>
        <p>
          Спасибо за бдительность, товарищ. Ваше донесение передано в отдел
          внутренней безопасности Предприятия 3826 для рассмотрения.
        </p>

        <hr className="separator" />

        <div
          className="soviet-panel"
          style={{ textAlign: "left", maxWidth: "500px", margin: "0 auto" }}
        >
          <h3>Что дальше?</h3>
          <ul
            style={{
              fontSize: "0.85rem",
              color: "var(--ah-text-dim)",
              lineHeight: "2",
              listStyle: "none",
              padding: 0,
            }}
          >
            <li>★ Донесение зарегистрировано в системе</li>
            <li>★ Материалы переданы на проверку</li>
            <li>★ Результаты проверки — конфиденциальны</li>
          </ul>
        </div>

        <Link
          href="/requests"
          className="btn-soviet"
          style={{ marginTop: "30px", display: "inline-block" }}
        >
          Вернуться к заявкам
        </Link>
      </div>

      <div className="propaganda-text">Бдительность — наше оружие</div>
    </div>
  );
}
