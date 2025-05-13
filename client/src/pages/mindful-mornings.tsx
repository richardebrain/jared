import Header from "@/components/Header";
import { MindfulMorningsTraining } from "@/components/MindfulMorningsTraining";
import { useAuth } from "@/hooks/use-auth";
import BearAssistant from "@/components/BearAssistant";

export default function MindfulMorningsPage() {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <Header />
      
      <main className="flex-1 container max-w-7xl mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <MindfulMorningsTraining />
          </div>
          
          <div className="col-span-1">
            {/* Bear assistant */}
            <BearAssistant user={user} />
            
            {/* Info card */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-neutral-200 mt-6">
              <h3 className="font-bold text-lg mb-2">About Mindful Mornings</h3>
              <p className="text-neutral-600 text-sm">
                Mindful Mornings is a daily practice designed to help you start your day with intention 
                and positivity. By taking a few minutes each morning to center yourself through breathing, 
                affirmations, and gratitude, you'll be better prepared to create a nurturing environment 
                for the children in your care.
              </p>
              
              <div className="mt-4 p-3 bg-amber-50 rounded-md border border-amber-100">
                <p className="text-sm text-amber-800">
                  <span className="font-semibold block mb-1">Remember:</span>
                  Completing this Mindful Mornings practice awards 15 XP points toward your teacher progression!
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}