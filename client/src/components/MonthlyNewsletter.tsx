import { CalendarDays, Star, Users, Book, Award } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import raisingArizonaLogo from "@assets/raising-arizona-logo.jpg";

export function MonthlyNewsletter() {
  // Get the current month and year for the newsletter
  const currentDate = new Date();
  const monthNames = ["January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December"];
  const currentMonth = monthNames[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();
  
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-md border border-[#006F51]/20">
      {/* Newsletter Header */}
      <div className="bg-gradient-to-r from-[#006F51] to-[#ff8c24] p-4 flex items-center justify-between">
        <div className="flex items-center">
          <div className="bg-white p-1 rounded-full mr-3">
            <img
              src={raisingArizonaLogo}
              alt="Raising Arizona Preschool"
              className="w-10 h-10 rounded-full object-cover"
            />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">Monthly Newsletter</h3>
            <p className="text-white/80 text-sm">{currentMonth} {currentYear}</p>
          </div>
        </div>
        <div className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium">
          <CalendarDays className="w-3 h-3 inline-block mr-1" />
          Published {formatDistanceToNow(new Date(currentYear, currentDate.getMonth(), 5), { addSuffix: true })}
        </div>
      </div>
      
      {/* Newsletter Content */}
      <div className="p-4">
        {/* Main Headline */}
        <div className="mb-3 pb-3 border-b border-neutral-200">
          <h4 className="font-bold text-lg text-[#006F51] mb-1">New "Mindful Mornings" Curriculum</h4>
          <p className="text-xs text-neutral-700">
            New curriculum helping children develop emotional regulation skills through breathing exercises and gratitude practices.
          </p>
        </div>
        
        {/* Highlights */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex items-start">
            <div className="bg-amber-50 p-1 rounded-lg mr-2 flex-shrink-0">
              <Star className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <h5 className="font-bold text-xs text-neutral-800">Teacher of the Month</h5>
              <p className="text-xs text-neutral-600">Sarah Johnson - Sensory Activities</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="bg-blue-50 p-1 rounded-lg mr-2 flex-shrink-0">
              <Book className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <h5 className="font-bold text-xs text-neutral-800">ITERS Training</h5>
              <p className="text-xs text-neutral-600">Register by May 20th</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="bg-neutral-50 p-3 text-center border-t border-neutral-200 flex items-center justify-between">
        <span className="text-xs text-neutral-600">View archives</span>
        <button className="bg-[#006F51] text-white rounded-lg px-3 py-1 text-xs font-medium hover:bg-opacity-90 transition">
          Read Full Newsletter
        </button>
      </div>
    </div>
  );
}