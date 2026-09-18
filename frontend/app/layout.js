import './globals.css';

export const metadata = {
  title: 'Предприятие 3826 — Портал Распределения Ресурсов',
  description: 'Система управления ресурсными заявками. Слава Труду!',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>
        <div className="page-container">
          {children}
        </div>
        <footer className="soviet-footer">
          <span className="footer-star">★</span>
          Предприятие 3826 · Отдел Распределения Ресурсов · Все права принадлежат народу
          <br />
          React Server Components v19 · Система «Коллектив 2.0»
        </footer>
      </body>
    </html>
  );
}
