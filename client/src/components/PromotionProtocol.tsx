import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check, Clock, GraduationCap, LucideIcon, Medal, Plus, Star, Target, UserPlus, Shield, Book, User, Info, Puzzle, Heart, HelpCircle, CloudSun, Crown } from "lucide-react";

interface ProtocolStepProps {
  title: string;
  description: React.ReactNode;
  icon: LucideIcon;
  iconColor?: string;
}

const ProtocolStep = ({ title, description, icon: Icon, iconColor = "text-primary" }: ProtocolStepProps) => {
  return (
    <div className="flex items-start gap-4 p-4 rounded-lg bg-card border">
      <div className={`p-2 rounded-full bg-primary/10 ${iconColor}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <div className="text-sm text-muted-foreground mt-1">
          {description}
        </div>
      </div>
    </div>
  );
};

export default function PromotionProtocol() {
  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
        <CardTitle className="text-2xl font-bold">New Hire Orientation and Promotion Protocol</CardTitle>
        <CardDescription>
          Learn about the training process and career advancement opportunities at Raising Arizona Preschool
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="orientation">
            <AccordionTrigger className="text-lg font-semibold">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-500" />
                <span>10-Day Orientation Training Process</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground mb-4">
                Upon hire each candidate will undergo a 10-Day Orientation Training Process. This process is to be determined by the Director 
                (Modules will be provided which meet competencies, however, do not have to be used) the 10-day training must meet the below 
                competencies as well the DES 10-Day checklist and be completed within the first 10 Days of hire.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <ProtocolStep 
                  title="Basic Safety" 
                  description="Learn essential safety protocols and procedures"
                  icon={Shield}
                  iconColor="text-red-500"
                />
                <ProtocolStep 
                  title="Handbook Knowledge" 
                  description="Understand policies and procedures in the employee handbook"
                  icon={Book}
                  iconColor="text-orange-500"
                />
                <ProtocolStep 
                  title="Name to Face Checks" 
                  description="Learn proper attendance and supervision procedures"
                  icon={User}
                  iconColor="text-yellow-500"
                />
                <ProtocolStep 
                  title="About RAP" 
                  description="Learn about Raising Arizona Preschool's mission and values"
                  icon={Info}
                  iconColor="text-green-500"
                />
                <ProtocolStep 
                  title="Importance of Preschool" 
                  description="Understand the critical role of early childhood education"
                  icon={GraduationCap}
                  iconColor="text-teal-500"
                />
                <ProtocolStep 
                  title="Play Based Practices" 
                  description="Learn play-based curriculum and teaching approaches"
                  icon={Puzzle}
                  iconColor="text-cyan-500"
                />
                <ProtocolStep 
                  title="Social Emotional Learning" 
                  description="Understanding emotional intelligence and its development"
                  icon={Heart}
                  iconColor="text-blue-500"
                />
                <ProtocolStep 
                  title="Challenging Behaviors" 
                  description="Strategies for managing and redirecting challenging behaviors"
                  icon={HelpCircle}
                  iconColor="text-indigo-500"
                />
                <ProtocolStep 
                  title="Positive Discipline" 
                  description="Learn effective, positive discipline techniques"
                  icon={Star}
                  iconColor="text-violet-500"
                />
                <ProtocolStep 
                  title="Mindfulness" 
                  description="Introduction to mindfulness practices for the classroom"
                  icon={CloudSun}
                  iconColor="text-purple-500"
                />
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="assistant">
            <AccordionTrigger className="text-lg font-semibold">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-500" />
                <span>30-Day In-Service (Assistant Teacher)</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              <p className="text-sm text-muted-foreground mb-4">
                After 30 days the candidate will undergo a coaching session which is measurable to determine the quality and retention of learning. 
                If candidate does not pass basic tasks, they will be asked to return to repeat the coaching process in 2 weeks. Once the candidate 
                successfully completes the measurable quiz and models knowledge, they will be promoted to Assistant Teacher.
              </p>
              
              <div className="p-4 rounded-lg bg-teal-50 border border-teal-200 flex items-center gap-3">
                <div className="p-2 rounded-full bg-teal-100 text-teal-600">
                  <Check className="w-4 h-4" />
                </div>
                <p className="text-sm font-medium text-teal-800">
                  Successfully completing this phase qualifies you for promotion to Assistant Teacher
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="lead">
            <AccordionTrigger className="text-lg font-semibold">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-500" />
                <span>Lead Teacher In-Service</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              <p className="text-sm text-muted-foreground mb-4">
                Candidate will work on site hands-on under the direction of a Lead teacher and the supervision of the Directors while learning 
                more in-depth early childhood education practices and theories. Candidate will gain knowledge of the ERS (ITERS/ECERS) and CLASS Tool.
              </p>
              
              <p className="text-sm text-muted-foreground mb-4">
                When ready candidate will be able to undergo a coaching session which is measurable and will determine the quality and retention of 
                learning for the role of Lead Teacher. If candidate does not successfully pass the measurable quiz and modeling coaching session, 
                they will be given resources, support, and will return in 2 weeks for another measurable coaching session. Upon successful completion 
                of coaching session candidate will be promoted to Lead Teacher.
              </p>
              
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                  <Check className="w-4 h-4" />
                </div>
                <p className="text-sm font-medium text-blue-800">
                  Successfully completing this phase qualifies you for promotion to Lead Teacher
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="master">
            <AccordionTrigger className="text-lg font-semibold">
              <div className="flex items-center gap-2">
                <Medal className="w-5 h-5 text-amber-500" />
                <span>Master Teacher In-Service</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              <p className="text-sm text-muted-foreground mb-4">
                Upon a minimum of 2 years serving as Lead teacher and gaining both extensive hands-on experience, Professional Development, and formal 
                Education the candidate can progress to Master Teacher. The Master Teacher needs to demonstrate superior knowledge in Environmental Rating 
                System (ERS) CLASS Tool, Arizona Early Learning Standards, and Arizona Infant Toddler Guidelines. The Master Teacher will mentor new hires 
                and assist the administrative team.
              </p>
              
              <div className="p-4 rounded-lg bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 flex items-center gap-3">
                <div className="p-2 rounded-full bg-amber-100 text-amber-600">
                  <Crown className="w-4 h-4" />
                </div>
                <p className="text-sm font-medium text-amber-800">
                  Achieving Master Teacher status comes with additional responsibilities and a $1.00 raise on the next payroll
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}