import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { LearningModule } from "@shared/schema";

interface CourseCardProps {
  course: LearningModule;
}

export default function CourseCard({ course }: CourseCardProps) {
  // Function to generate star ratings
  const renderStars = () => {
    // Generate random rating between 3.5 and 5
    const rating = Math.floor(Math.random() * 3) / 2 + 3.5;
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <div className="flex">
        {[...Array(fullStars)].map((_, i) => (
          <i key={`full-${i}`} className="ri-star-fill text-accent"></i>
        ))}
        {hasHalfStar && <i className="ri-star-half-fill text-accent"></i>}
        {[...Array(emptyStars)].map((_, i) => (
          <i key={`empty-${i}`} className="ri-star-line text-accent"></i>
        ))}
      </div>
    );
  };
  
  // Generate random number of reviews between 50 and 250
  const reviewCount = Math.floor(Math.random() * 200) + 50;
  
  // Generate random number of modules between 3 and 8
  const moduleCount = Math.floor(Math.random() * 5) + 3;
  
  // Determine badge text based on course properties
  const getBadgeType = () => {
    if (course.featured) return { text: "Popular", color: "bg-accent text-accent-foreground" };
    if (course.category === "speaking") return { text: "Best Seller", color: "bg-primary text-primary-foreground" };
    return { text: "New", color: "bg-secondary text-secondary-foreground" };
  };
  
  const badge = getBadgeType();
  
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden transition transform hover:-translate-y-1 hover:shadow-lg">
      {/* Course Image */}
      <img 
        src={course.imageUrl || "https://images.unsplash.com/photo-1503676260728-1c00da094a0b"} 
        alt={`${course.title} cover image`} 
        className="w-full h-40 object-cover" 
      />
      
      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-heading font-bold text-lg">{course.title}</h3>
          <span className={`${badge.color} text-xs font-bold rounded-full px-3 py-1`}>
            {badge.text}
          </span>
        </div>
        
        <p className="text-sm text-neutral-800 mb-4">{course.description}</p>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            {renderStars()}
            <span className="text-xs ml-1">({reviewCount})</span>
          </div>
          
          <div className="text-sm">
            <span className="font-semibold">{moduleCount}</span> modules
          </div>
        </div>
        
        <Link href={`/modules/${course.id}`}>
          <Button className="w-full mt-4">Start Learning</Button>
        </Link>
      </div>
    </div>
  );
}
