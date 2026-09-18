import Link from "next/link";
import SovietHeader from "../components/SovietHeader";
import LoginForm from "../components/LoginForm";

export default function LoginPage() {
  return (
    <div className="fade-in">
      <SovietHeader
        title="Авторизация"
        subtitle="Предъявите допуск к системе"
      />

      <div
        className="soviet-panel"
        style={{ maxWidth: "480px", margin: "0 auto" }}
      >
        <h2>Вход в систему</h2>
        <LoginForm />
      </div>

      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <p style={{ fontSize: "0.8rem", color: "var(--ah-text-dim)" }}>
          Нет допуска? <Link href="/register">Оформить регистрацию</Link>
        </p>
      </div>

      <div className="propaganda-text" style={{ marginTop: "40px" }}>
        Вход воспрещён для лиц без допуска
      </div>
    </div>
  );
}
