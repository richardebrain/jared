import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check, Clock, GraduationCap, LucideIcon, Medal, Plus, Star, Target, UserPlus } from "lucide-react";

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

// Icons
function Shield(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    </svg>
  );
}

function Book(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  );
}

function User(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function Info(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

function Puzzle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925-.314-.848-.88-1.448-1.849-1.448h-2c-1.1 0-2 .9-2 2 0 1.05.827 1.928 1.873 1.999.688.046 1.189.467 1.189 1.206 0 .74-.501 1.161-1.189 1.206A1.992 1.992 0 0 1 12 20H3c-.268 0-.491-.203-.539-.469a.563.563 0 0 1 .279-.574c.37-.242.582-.697.582-1.022a.997.997 0 0 0-.979-.979c-.268 0-.663.123-.903.369a.563.563 0 0 1-.921-.249C.505 16.7.688 16.211.979 15.919l1.616-1.616c.23-.23.381-.535.381-.854 0-.531-.568-.966-1.037-1.039-.222-.035-.417-.174-.526-.369s-.118-.427-.048-.633c.141-.415.516-.691.952-.691h2.72c.246 0 .455-.178.494-.422.09-.55-.321-1.045-.869-1.045-1.297 0-2.015-1.203-2.015-2.404 0-.315.068-.625.194-.913.126-.288.361-.635.645-.635h2.04c1.1 0 2-.9 2-2 0-1.1-.9-2-2-2h-1c-.268 0-.491-.203-.539-.469-.047-.266.063-.546.306-.677.783-.423 1.726-.471 2.571-.211 1.011.31 1.984-.094 2.604-.713l.433-.433A2.403 2.403 0 0 1 11.862 0c.631 0 1.233.251 1.679.697l1.531 1.533c.248.247.385.58.385.932 0 .714-.575 1.438-1.701 1.438-.732 0-1.296.64-1.218 1.367.057.52.496.908 1.023.908h2c1.1 0 2-.9 2-2 0-1.1-.9-2-2-2h-.344c-.268 0-.491-.203-.539-.469-.047-.266.063-.546.306-.677C16.088 1.023 17.952 1.71 18.96 3.43c.257.44.573.728.968.925.396.198.914.306 1.333.048.419-.258.581-.793.684-1.242.102-.449.149-.854.149-1.087 0-.549.38-.901.928-.937.549-.036.981.336.981.884 0.001 2.103-1.065 5.006-4.564 5.828Z" />
    </svg>
  );
}

function Heart(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

function HelpCircle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function CloudSun(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="M20 12h2" />
      <path d="m19.07 4.93-1.41 1.41" />
      <path d="M15.947 12.65a4 4 0 0 0-5.925-4.128" />
      <path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z" />
    </svg>
  );
}

function Crown(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
    </svg>
  );
}