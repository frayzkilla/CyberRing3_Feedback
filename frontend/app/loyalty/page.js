import SovietHeader from "../components/SovietHeader";
import LoyaltyForm from "../components/LoyaltyForm";

export default function LoyaltyPage() {
  return (
    <div>
      <SovietHeader
        title="Проверка лояльности"
        subtitle="Отдел кадров Предприятия 3826"
      />
      <LoyaltyForm />
    </div>
  );
}
