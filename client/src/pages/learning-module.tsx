import { useParams } from "wouter";
import Header from "@/components/Header";
import { ModulePlayer } from "@/components/ModulePlayer";

export default function LearningModulePage() {
  const { moduleId } = useParams<{ moduleId: string }>();

  if (!moduleId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900">Module ID not provided</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <ModulePlayer moduleId={moduleId} />
    </div>
  );
}