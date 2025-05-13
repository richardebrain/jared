import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Newspaper } from "lucide-react";

export function MonthlyNewsletter() {
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const [expanded, setExpanded] = useState(false);
  
  return (
    <Card className="border border-blue-200 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Newspaper className="h-5 w-5 text-blue-500 mr-2" />
            <CardTitle className="text-lg">Monthly Newsletter</CardTitle>
          </div>
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{currentMonth}</span>
        </div>
        <CardDescription>
          Stay updated with the latest news from Raising Arizona Preschool
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className={expanded ? "" : "line-clamp-4"}>
          <h3 className="font-semibold text-lg mb-2">Building Chapter One Together</h3>
          <p className="mb-3 text-sm">
            Dear Educators,
          </p>
          <p className="mb-3 text-sm">
            This month we're focusing on how our mindful teaching practices contribute to building "Chapter One" 
            in each child's life. Every interaction, every lesson, and every word of encouragement helps write 
            the foundation of their story.
          </p>
          <p className="mb-3 text-sm">
            We're excited to announce our upcoming "Building Blocks" workshop series where we'll 
            explore practical ways to implement our core teaching philosophy in everyday classroom activities.
          </p>
          <p className="mb-3 text-sm">
            Don't forget about our "Mindful Mornings" session next Friday. These popular gatherings have been 
            shown to significantly reduce classroom stress and improve student engagement throughout the day.
          </p>
          <p className="mb-3 text-sm">
            Thank you for your dedication to our students and our vision. Your commitment to excellence 
            makes Raising Arizona Preschool a special place where every child can thrive.
          </p>
          <p className="text-sm font-medium">
            Warmly,<br />
            The Raising Arizona Leadership Team
          </p>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setExpanded(!expanded)}
          className="mt-2 w-full text-blue-600 hover:text-blue-800 hover:bg-blue-50"
        >
          {expanded ? "Show Less" : "Read More"}
        </Button>
      </CardContent>
    </Card>
  );
}