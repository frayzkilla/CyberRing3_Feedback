import SovietHeader from "../components/SovietHeader";
import DonosForm from "../components/DonosForm";

export default function DonosPage() {
  return (
    <div>
      <SovietHeader
        title="Донесение"
        subtitle="Отдел внутренней безопасности предприятия"
      />
      <DonosForm />
    </div>
  );
}
