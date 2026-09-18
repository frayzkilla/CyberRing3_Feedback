import SovietHeader from "../components/SovietHeader";
import DiagnosticsPanel from "../components/DiagnosticsPanel";
import { checkSystemStatus } from "../actions";

export default async function DiagnosticsPage() {
  const status = await checkSystemStatus();

  return (
    <div>
      <SovietHeader
        title="Диагностика"
        subtitle="Контроль подсистем Предприятия 3826"
      />

      {/* Server-rendered system overview */}
      <div className="soviet-panel fade-in" style={{ marginBottom: "20px" }}>
        <h2>Общее состояние системы</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
          }}
        >
          <div>
            <span
              style={{
                fontSize: "0.7rem",
                color: "var(--ah-text-dim)",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Статус
            </span>
            <p
              style={{
                color: "var(--ah-success)",
                fontFamily: "var(--font-pixel)",
                fontSize: "0.7rem",
                marginTop: "4px",
              }}
            >
              {status.overall}
            </p>
          </div>
          <div>
            <span
              style={{
                fontSize: "0.7rem",
                color: "var(--ah-text-dim)",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Версия
            </span>
            <p
              style={{
                color: "var(--ah-glow-cyan)",
                fontFamily: "var(--font-mono)",
                fontSize: "0.85rem",
                marginTop: "4px",
              }}
            >
              {status.version}
            </p>
          </div>
          <div>
            <span
              style={{
                fontSize: "0.7rem",
                color: "var(--ah-text-dim)",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Аптайм
            </span>
            <p
              style={{
                color: "var(--ussr-gold)",
                fontSize: "0.85rem",
                marginTop: "4px",
              }}
            >
              {status.uptime}
            </p>
          </div>
          <div>
            <span
              style={{
                fontSize: "0.7rem",
                color: "var(--ah-text-dim)",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Активных пользователей
            </span>
            <p
              style={{
                color: "var(--ussr-gold)",
                fontSize: "0.85rem",
                marginTop: "4px",
              }}
            >
              {status.activeUsers}
            </p>
          </div>
        </div>
      </div>

      {/* Client component with Server Action form */}
      <DiagnosticsPanel />
    </div>
  );
}
