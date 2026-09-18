import SovietHeader from "../components/SovietHeader";
import FeedbackForm from "../components/FeedbackForm";

export default function FeedbackPage() {
  return (
    <div>
      <SovietHeader
        title="Обратная связь"
        subtitle="Жалобы и предложения трудящихся"
      />
      <FeedbackForm />
    </div>
  );
}
