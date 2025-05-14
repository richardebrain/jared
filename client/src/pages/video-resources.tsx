import { VideoResourceLibrary } from "@/components/VideoResourceLibrary";
import Header from "@/components/Header";

export default function VideoResourcesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="container mx-auto py-8 px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Video Resources Library</h1>
            <p className="text-lg text-gray-600">
              Explore our curated collection of educational videos to enhance your teaching skills and professional development.
              These resources are designed to support your growth as an early childhood educator and help implement the 
              "Building Chapter One" philosophy in your classroom.
            </p>
          </div>
          <VideoResourceLibrary />
        </div>
      </main>
    </div>
  );
}