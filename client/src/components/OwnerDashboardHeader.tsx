import { Button } from "@/components/ui/button";
import { GraduationCap, Star } from "lucide-react";
import { Link } from "wouter";

interface OwnerDashboardHeaderProps {
  onOpenReviewsTab?: () => void;
}

export default function OwnerDashboardHeader({ onOpenReviewsTab }: OwnerDashboardHeaderProps) {
  return (
    <div className="bg-gradient-to-b from-amber-50 to-amber-100 p-4 rounded-lg mb-6 border border-amber-200 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-amber-800">Owner Dashboard</h1>
          <p className="text-amber-700">Manage your preschool locations and operations</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Link to="/dashboard">
            <Button 
              variant="default" 
              className="gap-2 bg-amber-600 hover:bg-amber-700"
            >
              <GraduationCap className="h-4 w-4" />
              Back to Teacher Dashboard
            </Button>
          </Link>
          
          {onOpenReviewsTab && (
            <Button 
              variant="outline"
              className="gap-2 border-amber-300 text-amber-800 hover:bg-amber-100"
              onClick={onOpenReviewsTab}
            >
              <Star className="h-4 w-4" />
              View Google Reviews
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}