import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { LearningModule } from "@shared/schema";

interface ModuleCardProps {
  module: LearningModule;
  progress: number;
}

export default function ModuleCard({ module, progress }: ModuleCardProps) {
  // Determine status color based on module category
  const getBorderColor = () => {
    switch (module.category) {
      case "speaking":
        return "border-primary";
      case "grammar":
        return "border-secondary";
      case "vocabulary":
        return "border-accent";
      default:
        return "border-neutral-800";
    }
  };
  
  // Determine icon based on module category
  const getCategoryIcon = () => {
    switch (module.category) {
      case "speaking":
        return "ri-mental-health-line";
      case "grammar":
        return "ri-book-open-line";
      case "vocabulary":
        return "ri-translate-2";
      case "writing":
        return "ri-pencil-line";
      case "reading":
        return "ri-file-text-line";
      default:
        return "ri-book-line";
    }
  };
  
  // Format progress for svg circle
  const circumference = 339.292; // 2 * PI * r, where r = 54
  const strokeDashoffset = circumference * (1 - progress / 100);
  
  return (
    <div className={`bg-white rounded-xl shadow-sm hover:shadow-md transition p-4 border-l-4 ${getBorderColor()}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 mr-3">
          <h3 className="font-heading font-bold mb-1 line-clamp-1">{module.title}</h3>
          <p className="text-sm text-neutral-800 mb-2 line-clamp-2 h-10">{module.description}</p>
          <div className="flex items-center text-xs">
            <span className="flex items-center mr-3">
              <i className="ri-time-line mr-1"></i> {module.duration} min
            </span>
            <span className="flex items-center">
              <i className="ri-bar-chart-line mr-1"></i> {module.difficulty}
            </span>
          </div>
        </div>
        <div className="relative h-14 w-14 flex-shrink-0">
          <div className={`absolute inset-0 bg-${module.category === "speaking" ? "primary" : module.category === "grammar" ? "secondary" : "accent"} bg-opacity-10 rounded-full flex items-center justify-center`}>
            <i className={`${getCategoryIcon()} text-xl ${module.category === "speaking" ? "text-primary" : module.category === "grammar" ? "text-secondary" : "text-accent"}`}></i>
          </div>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--muted))" strokeWidth="12" />
            <circle 
              cx="60" 
              cy="60" 
              r="54" 
              fill="none" 
              stroke={module.category === "speaking" 
                ? "hsl(var(--primary))" 
                : module.category === "grammar" 
                  ? "hsl(var(--secondary))" 
                  : "hsl(var(--accent))"} 
              strokeWidth="12" 
              strokeDasharray={circumference} 
              strokeDashoffset={strokeDashoffset}
            />
          </svg>
        </div>
      </div>
      
      <div className="flex justify-between items-center mt-3 pt-3 border-t border-neutral-100">
        <div>
          <span className={`inline-block px-2 py-1 ${
            module.featured 
              ? "bg-primary/10 text-primary" 
              : "bg-green-100 text-green-800"
          } text-xs rounded-md`}>
            {module.featured ? "Featured" : "Core"}
          </span>
        </div>
        <Link href={`/modules/${module.id}`}>
          <Button variant="link" className="text-primary font-semibold text-sm hover:underline">
            {progress > 0 ? "Continue" : "Start"}
          </Button>
        </Link>
      </div>
    </div>
  );
}
