import SovietHeader from "../../components/SovietHeader";
import RequestDetail from "../../components/RequestDetail";

export default async function RequestDetailPage({ params }) {
  const { id } = await params;

  return (
    <div>
      <SovietHeader
        title={`Заявка #${id}`}
        subtitle="Детальный просмотр ресурсной заявки"
      />
      <RequestDetail id={id} />
    </div>
  );
}
