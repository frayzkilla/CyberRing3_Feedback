import SovietHeader from '../../components/SovietHeader';
import CreateRequestForm from '../../components/CreateRequestForm';

// React Server Component
export default function NewRequestPage() {
  return (
    <div>
      <SovietHeader
        title="Новая заявка"
        subtitle="Форма подачи ресурсного запроса"
      />
      <CreateRequestForm />
    </div>
  );
}
