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
        <div className="mb-4 pb-4 border-b border-neutral-200">
          <h4 className="font-bold text-lg text-[#006F51] mb-2">New "Mindful Mornings" Curriculum Launched!</h4>
          <p className="text-sm text-neutral-700 mb-3">
            We're excited to announce the launch of our new "Mindful Mornings" curriculum, designed to help children develop emotional regulation skills through breathing exercises, self-affirmations, and gratitude practices. The program has already shown remarkable results in our pilot classrooms.
          </p>
          <div className="flex items-center text-xs text-neutral-500">
            <Users className="w-3 h-3 mr-1" />
            <span>By Lead Teacher Development Team</span>
          </div>
        </div>
        
        {/* Teacher of the Month */}
        <div className="flex items-start mb-4 pb-4 border-b border-neutral-200">
          <div className="bg-amber-50 p-2 rounded-lg mr-3">
            <Star className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h5 className="font-bold text-neutral-800 mb-1">Teacher of the Month: Sarah Johnson</h5>
            <p className="text-xs text-neutral-600 mb-2">
              Congratulations to Ms. Sarah for implementing innovative sensory activities that have significantly improved student engagement in her toddler classroom!
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#006F51] font-medium">View Achievement →</span>
            </div>
          </div>
        </div>
        
        {/* Upcoming Training */}
        <div className="flex items-start mb-4 pb-4 border-b border-neutral-200">
          <div className="bg-blue-50 p-2 rounded-lg mr-3">
            <Book className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h5 className="font-bold text-neutral-800 mb-1">Upcoming ITERS Training</h5>
            <p className="text-xs text-neutral-600 mb-2">
              Don't miss our upcoming ITERS-R refresher training session on the 25th. All teachers are encouraged to attend this valuable opportunity to improve classroom quality ratings.
            </p>
            <div className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full">
              Register by May 20th
            </div>
          </div>
        </div>
        
        {/* Fun Fact */}
        <div className="flex items-start">
          <div className="bg-purple-50 p-2 rounded-lg mr-3">
            <Award className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h5 className="font-bold text-neutral-800 mb-1">Raising Arizona Fun Fact</h5>
            <p className="text-xs text-neutral-600">
              Did you know? Our preschool's "Bear Buddy" mascot was named by our very first class of preschoolers in 2018 through a school-wide vote. Remember to use "Breathe, Smile, Be Present" with your students!
            </p>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="bg-neutral-50 p-4 text-center border-t border-neutral-200">
        <p className="text-xs text-neutral-600 mb-2">View all past newsletters in the Teacher Resources section.</p>
        <button className="bg-[#006F51] text-white rounded-lg px-4 py-2 text-xs font-medium hover:bg-opacity-90 transition">
          Read Full Newsletter
        </button>
      </div>
    </div>
  );
}