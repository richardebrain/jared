import Header from "@/components/Header";
import { CoreValuesTraining } from "@/components/CoreValuesTraining";
import { useSimpleAuth } from "@/lib/simple-auth";
import BearAssistant from "@/components/BearAssistant";

export default function CoreValuesPage() {
  const { user } = useSimpleAuth();
  
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <Header />
      
      <main className="flex-1 container max-w-7xl mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <CoreValuesTraining />
          </div>
          
          <div className="col-span-1">
            {/* Bear assistant */}
            <BearAssistant user={user} />
            
            {/* Info card */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-neutral-200 mt-6">
              <h3 className="font-bold text-lg mb-2">About Core Values</h3>
              <p className="text-neutral-600 text-sm">
                The five core values of Raising Arizona Preschool form the foundation of our approach to early childhood education. 
                By embodying these values, you'll create a nurturing and effective learning environment for our children.
              </p>
              
              <div className="mt-4 p-3 bg-amber-50 rounded-md border border-amber-100">
                <p className="text-sm text-amber-800">
                  <span className="font-semibold block mb-1">Remember:</span>
                  Successful completion of this Core Values training module awards 20 XP points toward your teacher progression!
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}