import SovietHeader from '../components/SovietHeader';
import RequestsList from '../components/RequestsList';

// React Server Component — wraps client-side interactive list
export default function RequestsPage() {
  return (
    <div>
      <SovietHeader
        title="Ресурсные заявки"
        subtitle="Отдел распределения материальных ценностей"
      />
      <RequestsList />
    </div>
  );
}
