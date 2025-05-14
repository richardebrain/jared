import { VideoResourceLibrary } from "@/components/VideoResourceLibrary";
import Header from "@/components/Header";

export default function VideoResourcesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="py-6">
          <VideoResourceLibrary />
        </div>
      </main>
    </div>
  );
}