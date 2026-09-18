export default function SovietHeader({ title, subtitle }) {
  return (
    <header className="soviet-header">
      <h1>{title || "Предприятие 3826"}</h1>
      {subtitle && <p className="subtitle">{subtitle}</p>}
      <span className="facility-badge">Система «Коллектив 2.0»</span>
    </header>
  );
}
