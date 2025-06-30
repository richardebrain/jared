import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Camera, FileText, Users, Brain, Star, Calendar, Download, Printer, Share, CheckCircle, Circle } from 'lucide-react';

interface PortfolioEntry {
  id: number;
  title: string;
  description?: string;
  entryDate: string;
  entryType: string;
  photoUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  workSampleType?: string;
  workSampleDescription?: string;
  teacherObservation?: string;
  behaviorObservation?: string;
  socialInteraction?: string;
  developmentalDomain?: string[];
  conversationTranscript?: string;
  milestoneAchieved?: string;
  skillsDemonstrated?: string[];
  familyInput?: string;
  familyFeedback?: string;
  learningStandards?: string[];
  naeyc_standards?: string[];
  headStartStandards?: string[];
  eventType?: string;
  eventDescription?: string;
  tags?: string[];
}

interface Child {
  id: number;
  firstName: string;
  lastName: string;
  birthDate?: string;
}

interface PortfolioDisplayProps {
  child: Child;
  entries: PortfolioEntry[];
  schoolYear?: string;
  teacherName?: string;
  programName?: string;
}

const DEVELOPMENTAL_DOMAINS = {
  'Social-Emotional': { icon: Users, color: 'bg-blue-100 text-blue-800' },
  'Cognitive': { icon: Brain, color: 'bg-purple-100 text-purple-800' },
  'Language and Literacy': { icon: FileText, color: 'bg-green-100 text-green-800' },
  'Physical Development': { icon: Star, color: 'bg-orange-100 text-orange-800' },
  'Creative Arts': { icon: Camera, color: 'bg-pink-100 text-pink-800' },
  'Mathematics': { icon: Brain, color: 'bg-indigo-100 text-indigo-800' },
  'Science': { icon: Star, color: 'bg-teal-100 text-teal-800' },
  'Social Studies': { icon: Users, color: 'bg-yellow-100 text-yellow-800' }
};

const SKILL_CHECKLIST = [
  // Social-Emotional
  { domain: 'Social-Emotional', skills: ['Shares toys with peers', 'Expresses feelings with words', 'Follows classroom rules', 'Shows empathy', 'Manages emotions'] },
  // Cognitive
  { domain: 'Cognitive', skills: ['Counts to 10', 'Recognizes some letters', 'Sorts objects by color', 'Solves simple problems', 'Shows curiosity'] },
  // Language
  { domain: 'Language and Literacy', skills: ['Speaks in complete sentences', 'Asks questions', 'Tells simple stories', 'Recognizes own name', 'Enjoys books'] },
  // Physical
  { domain: 'Physical Development', skills: ['Runs, jumps, and climbs', 'Uses scissors safely', 'Zips coat independently', 'Holds crayon properly', 'Balances on one foot'] }
];

export default function PortfolioDisplay({ child, entries, schoolYear = '2024-2025', teacherName = 'Ms. Johnson', programName = 'Sunshine Preschool' }: PortfolioDisplayProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return 'N/A';
    const birth = new Date(birthDate);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear();
    return `${age} years`;
  };

  const getEntriesByType = (type: string) => {
    return entries.filter(entry => entry.entryType === type);
  };

  const getEntriesByDomain = (domain: string) => {
    return entries.filter(entry => 
      entry.developmentalDomain?.includes(domain)
    );
  };

  const hasSkillDemonstrated = (skill: string) => {
    return entries.some(entry => 
      entry.skillsDemonstrated?.includes(skill) ||
      entry.milestoneAchieved?.toLowerCase().includes(skill.toLowerCase()) ||
      entry.teacherObservation?.toLowerCase().includes(skill.toLowerCase())
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Cover Page */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-blue-800">
            {child.firstName}'s Learning Journey
          </CardTitle>
          <CardDescription className="text-lg italic text-blue-600">
            "Every child is a unique star!"
          </CardDescription>
          <div className="mt-4 space-y-2 text-sm">
            <p><strong>Child's Name:</strong> {child.firstName} {child.lastName}</p>
            <p><strong>Age:</strong> {calculateAge(child.birthDate)}</p>
            <p><strong>Program:</strong> {programName}</p>
            <p><strong>Teacher:</strong> {teacherName}</p>
            <p><strong>School Year:</strong> {schoolYear}</p>
          </div>
        </CardHeader>
      </Card>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documentation">Documentation</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="family">Family Input</TabsTrigger>
        </TabsList>

        {/* Portfolio Overview */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(DEVELOPMENTAL_DOMAINS).map(([domain, config]) => {
              const domainEntries = getEntriesByDomain(domain);
              const Icon = config.icon;
              
              return (
                <Card key={domain} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Icon className="h-4 w-4" />
                      {domain}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-800">
                      {domainEntries.length}
                    </div>
                    <div className="text-xs text-gray-600">entries</div>
                    <div className="mt-2">
                      <Badge className={config.color} variant="secondary">
                        {domainEntries.length > 0 ? 'Active' : 'Emerging'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Recent Highlights */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Highlights</CardTitle>
              <CardDescription>Latest portfolio entries and milestones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {entries.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="border-l-4 border-blue-200 pl-4 py-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{entry.title}</h4>
                      <span className="text-xs text-gray-500">{formatDate(entry.entryDate)}</span>
                    </div>
                    {entry.milestoneAchieved && (
                      <div className="mt-1 text-sm font-medium text-green-600">
                        🌟 Milestone: {entry.milestoneAchieved}
                      </div>
                    )}
                    {entry.description && (
                      <p className="text-sm text-gray-600 mt-1">{entry.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documentation Tab */}
        <TabsContent value="documentation" className="space-y-6">
          {/* Photographs Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Photographs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getEntriesByType('photograph').map((entry) => (
                  <div key={entry.id} className="space-y-2">
                    {entry.photoUrl && (
                      <img 
                        src={entry.photoUrl} 
                        alt={entry.title}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    )}
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm">{entry.title}</h4>
                      <p className="text-xs text-gray-600">{formatDate(entry.entryDate)}</p>
                      {entry.description && (
                        <p className="text-xs text-gray-700">{entry.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Work Samples Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Samples of Work
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getEntriesByType('work_sample').map((entry) => (
                  <div key={entry.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{entry.title}</h4>
                      <div className="flex items-center gap-2">
                        {entry.workSampleType && (
                          <Badge variant="outline">{entry.workSampleType}</Badge>
                        )}
                        <span className="text-xs text-gray-500">{formatDate(entry.entryDate)}</span>
                      </div>
                    </div>
                    {entry.photoUrl && (
                      <img 
                        src={entry.photoUrl} 
                        alt={entry.title}
                        className="w-full max-w-md h-48 object-cover rounded mb-2"
                      />
                    )}
                    {entry.workSampleDescription && (
                      <p className="text-sm text-gray-700">{entry.workSampleDescription}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Observations Section */}
          <Card>
            <CardHeader>
              <CardTitle>Observations and Anecdotal Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {entries.filter(entry => entry.teacherObservation || entry.behaviorObservation || entry.socialInteraction).map((entry) => (
                  <div key={entry.id} className="border-l-4 border-green-200 pl-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{entry.title}</h4>
                      <span className="text-xs text-gray-500">{formatDate(entry.entryDate)}</span>
                    </div>
                    {entry.teacherObservation && (
                      <div className="mb-2">
                        <strong className="text-sm">Teacher Observation:</strong>
                        <p className="text-sm text-gray-700 mt-1">{entry.teacherObservation}</p>
                      </div>
                    )}
                    {entry.behaviorObservation && (
                      <div className="mb-2">
                        <strong className="text-sm">Behavior & Engagement:</strong>
                        <p className="text-sm text-gray-700 mt-1">{entry.behaviorObservation}</p>
                      </div>
                    )}
                    {entry.socialInteraction && (
                      <div className="mb-2">
                        <strong className="text-sm">Social Interactions:</strong>
                        <p className="text-sm text-gray-700 mt-1">{entry.socialInteraction}</p>
                      </div>
                    )}
                    {entry.conversationTranscript && (
                      <div className="bg-yellow-50 p-2 rounded mt-2">
                        <strong className="text-sm">Quote:</strong>
                        <p className="text-sm italic">"{entry.conversationTranscript}"</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assessments Tab */}
        <TabsContent value="assessments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Developmental Assessments</CardTitle>
              <CardDescription>Skills and milestones tracking based on observations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {SKILL_CHECKLIST.map((category) => (
                  <div key={category.domain} className="space-y-3">
                    <h3 className="font-medium text-lg flex items-center gap-2">
                      {DEVELOPMENTAL_DOMAINS[category.domain as keyof typeof DEVELOPMENTAL_DOMAINS] && (
                        <div className={`w-3 h-3 rounded ${DEVELOPMENTAL_DOMAINS[category.domain as keyof typeof DEVELOPMENTAL_DOMAINS].color}`} />
                      )}
                      {category.domain} Checklist
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {category.skills.map((skill) => {
                        const demonstrated = hasSkillDemonstrated(skill);
                        return (
                          <div key={skill} className="flex items-center gap-2">
                            {demonstrated ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <Circle className="h-4 w-4 text-gray-400" />
                            )}
                            <span className={demonstrated ? 'text-green-800' : 'text-gray-600'}>
                              {skill}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Milestones Achieved */}
          <Card>
            <CardHeader>
              <CardTitle>Milestones Achieved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {entries.filter(entry => entry.milestoneAchieved).map((entry) => (
                  <div key={entry.id} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <div className="flex-1">
                      <p className="font-medium text-green-800">{entry.milestoneAchieved}</p>
                      <p className="text-sm text-green-600">{formatDate(entry.entryDate)} - {entry.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Family Input Tab */}
        <TabsContent value="family" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Family Input</CardTitle>
              <CardDescription>Parent feedback and home observations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {entries.filter(entry => entry.familyInput || entry.familyFeedback).map((entry) => (
                  <div key={entry.id} className="border rounded-lg p-4 bg-blue-50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Family Note</h4>
                      <span className="text-xs text-gray-500">{formatDate(entry.entryDate)}</span>
                    </div>
                    {entry.familyInput && (
                      <p className="text-sm text-gray-700 mb-2">{entry.familyInput}</p>
                    )}
                    {entry.familyFeedback && (
                      <p className="text-sm text-gray-700">{entry.familyFeedback}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Special Events */}
          <Card>
            <CardHeader>
              <CardTitle>Documentation of Special Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getEntriesByType('special_event').map((entry) => (
                  <div key={entry.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{entry.title}</h4>
                      <div className="flex items-center gap-2">
                        {entry.eventType && (
                          <Badge variant="outline">{entry.eventType}</Badge>
                        )}
                        <span className="text-xs text-gray-500">{formatDate(entry.entryDate)}</span>
                      </div>
                    </div>
                    {entry.photoUrl && (
                      <img 
                        src={entry.photoUrl} 
                        alt={entry.title}
                        className="w-full max-w-md h-48 object-cover rounded mb-2"
                      />
                    )}
                    {entry.eventDescription && (
                      <p className="text-sm text-gray-700">{entry.eventDescription}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* End of Year Reflection */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200">
        <CardHeader>
          <CardTitle className="text-purple-800">Teacher Reflection</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 italic">
            "{child.firstName} has grown so much this year! They are a caring friend, a curious learner, 
            and a confident problem-solver. We look forward to seeing them continue to shine!"
          </p>
          <p className="text-right mt-4 text-sm text-gray-600">—{teacherName}</p>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
        <Button variant="outline" className="flex items-center gap-2">
          <Print className="h-4 w-4" />
          Print Portfolio
        </Button>
        <Button variant="outline" className="flex items-center gap-2">
          <Share className="h-4 w-4" />
          Share with Family
        </Button>
      </div>
    </div>
  );
}