import Link from "next/link";
import SovietHeader from "../components/SovietHeader";
import RegisterForm from "../components/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="fade-in">
      <SovietHeader
        title="Регистрация"
        subtitle="Оформление допуска нового сотрудника"
      />

      <div
        className="soviet-panel"
        style={{ maxWidth: "480px", margin: "0 auto" }}
      >
        <h2>Оформление допуска</h2>
        <RegisterForm />
      </div>

      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <p style={{ fontSize: "0.8rem", color: "var(--ah-text-dim)" }}>
          Уже имеете допуск? <Link href="/login">Войти в систему</Link>
        </p>
      </div>

      <div className="propaganda-text" style={{ marginTop: "40px" }}>
        Каждый новый сотрудник — кирпичик в фундаменте светлого будущего
      </div>
    </div>
  );
}
