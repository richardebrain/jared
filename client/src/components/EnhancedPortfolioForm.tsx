import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Calendar, Upload, FileText, Camera, Mic, Video, Users, Brain, Star, Eye, Heart, Palette } from 'lucide-react';
import LearningStandardsDropdown from './LearningStandardsDropdown';
import PhotoUploader from './PhotoUploader';

// NAEYC & Head Start aligned portfolio entry schema
const portfolioEntrySchema = z.object({
  // Basic Information
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  entryDate: z.string().min(1, "Entry date is required"),
  entryType: z.enum(['photograph', 'work_sample', 'observation', 'recording', 'assessment', 'family_input', 'special_event']),
  
  // Media Content
  photoUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  audioUrl: z.string().optional(),
  
  // Work Samples
  workSampleType: z.string().optional(),
  workSampleDescription: z.string().optional(),
  
  // Observations (Core NAEYC Requirement)
  observationNotes: z.string().optional(),
  teacherObservation: z.string().optional(),
  behaviorObservation: z.string().optional(),
  socialInteraction: z.string().optional(),
  
  // Developmental Domains (Head Start Framework)
  developmentalDomain: z.array(z.string()).default([]),
  
  // Conversations and Recordings
  conversationTranscript: z.string().optional(),
  conversationContext: z.string().optional(),
  
  // Milestone Tracking
  milestoneAchieved: z.string().optional(),
  skillsDemonstrated: z.array(z.string()).default([]),
  
  // Family Input
  familyInput: z.string().optional(),
  familyFeedback: z.string().optional(),
  
  // Learning Standards
  learningStandards: z.array(z.string()).default([]),
  
  // Special Events
  eventType: z.string().optional(),
  eventDescription: z.string().optional(),
  
  // Metadata
  tags: z.array(z.string()).default([]),
  accessLevel: z.enum(['teacher', 'family', 'school']).default('teacher'),
});

type PortfolioFormData = z.infer<typeof portfolioEntrySchema>;

interface EnhancedPortfolioFormProps {
  childId: number;
  onSubmit: (data: PortfolioFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const ENTRY_TYPES = [
  { value: 'photograph', label: 'Photograph', icon: Camera, description: 'Photos of activities, milestones, and interactions' },
  { value: 'work_sample', label: 'Work Sample', icon: Palette, description: 'Artwork, drawings, writing samples, crafts' },
  { value: 'observation', label: 'Observation', icon: Eye, description: 'Teacher observations and anecdotal notes' },
  { value: 'recording', label: 'Recording', icon: Mic, description: 'Audio/video recordings of conversations or activities' },
  { value: 'assessment', label: 'Assessment', icon: FileText, description: 'Developmental assessments and checklists' },
  { value: 'family_input', label: 'Family Input', icon: Heart, description: 'Parent feedback and home observations' },
  { value: 'special_event', label: 'Special Event', icon: Star, description: 'Field trips, celebrations, special activities' }
];

const DEVELOPMENTAL_DOMAINS = [
  'Social-Emotional',
  'Cognitive',
  'Language and Literacy',
  'Physical Development',
  'Creative Arts',
  'Mathematics',
  'Science',
  'Social Studies'
];

const WORK_SAMPLE_TYPES = [
  'Artwork',
  'Drawing',
  'Painting',
  'Writing Sample',
  'Craft Project',
  'Building/Construction',
  'Clay Work',
  'Collage'
];

const SKILL_CATEGORIES = [
  'Fine Motor Skills',
  'Gross Motor Skills',
  'Language Development',
  'Social Skills',
  'Problem Solving',
  'Creativity',
  'Self-Help Skills',
  'Mathematical Thinking',
  'Scientific Inquiry'
];

export default function EnhancedPortfolioForm({ childId, onSubmit, onCancel, isLoading }: EnhancedPortfolioFormProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  const form = useForm<PortfolioFormData>({
    resolver: zodResolver(portfolioEntrySchema),
    defaultValues: {
      entryDate: new Date().toISOString().split('T')[0],
      entryType: 'photograph',
      developmentalDomain: [],
      skillsDemonstrated: [],
      learningStandards: [],
      tags: [],
      accessLevel: 'teacher'
    }
  });

  const watchedEntryType = form.watch('entryType');

  const handleSubmit = (data: PortfolioFormData) => {
    onSubmit({
      ...data,
      skillsDemonstrated: selectedSkills,
      tags
    });
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const EntryTypeIcon = ENTRY_TYPES.find(t => t.value === watchedEntryType)?.icon || Camera;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <EntryTypeIcon className="h-5 w-5" />
          Create Portfolio Entry
        </CardTitle>
        <CardDescription>
          Document this child's growth and learning following NAEYC and Head Start best practices
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="observations">Observations</TabsTrigger>
                <TabsTrigger value="development">Development</TabsTrigger>
                <TabsTrigger value="standards">Standards</TabsTrigger>
              </TabsList>

              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Entry Title *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Building with blocks" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="entryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="entryType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Portfolio Entry Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select entry type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ENTRY_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <type.icon className="h-4 w-4" />
                                <div>
                                  <div className="font-medium">{type.label}</div>
                                  <div className="text-xs text-muted-foreground">{type.description}</div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe what happened in this moment..."
                          className="min-h-20"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Provide context about the activity, setting, and child's engagement
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Media Upload Section */}
                <div className="space-y-4">
                  <Label>Media Content</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <PhotoUploader
                      onImageUploaded={(url) => form.setValue('photoUrl', url)}
                      showPreview={true}
                    />
                  </div>
                </div>

                {/* Work Sample Fields (conditional) */}
                {watchedEntryType === 'work_sample' && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="workSampleType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Work Sample Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select work sample type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {WORK_SAMPLE_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="workSampleDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Work Sample Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe the work sample, materials used, process observed..."
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </TabsContent>

              {/* Observations Tab */}
              <TabsContent value="observations" className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="teacherObservation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teacher Observation</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="What did you observe about the child's engagement, approach, and learning?"
                            className="min-h-24"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Objective observations about the child's actions, words, and behaviors
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="behaviorObservation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Behavior & Engagement</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="How did the child approach this activity? What was their level of engagement?"
                            className="min-h-20"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="socialInteraction"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Social Interactions</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="How did the child interact with peers or adults during this activity?"
                            className="min-h-20"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Conversation Fields */}
                  <FormField
                    control={form.control}
                    name="conversationTranscript"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conversations</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Record any meaningful conversations or quotes from the child..."
                            className="min-h-20"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Include direct quotes when possible - these show language development
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* Development Tab */}
              <TabsContent value="development" className="space-y-4">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="developmentalDomain"
                    render={() => (
                      <FormItem>
                        <FormLabel>Developmental Domains (Head Start Framework)</FormLabel>
                        <FormDescription>
                          Select all developmental areas demonstrated in this entry
                        </FormDescription>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {DEVELOPMENTAL_DOMAINS.map((domain) => (
                            <FormField
                              key={domain}
                              control={form.control}
                              name="developmentalDomain"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(domain)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, domain])
                                          : field.onChange(field.value?.filter((value) => value !== domain))
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm">{domain}</FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="milestoneAchieved"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Milestone Achieved</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., First time writing name independently"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Record any significant developmental milestone observed
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <Label>Skills Demonstrated</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {SKILL_CATEGORIES.map((skill) => (
                        <div key={skill} className="flex items-center space-x-2">
                          <Checkbox
                            id={skill}
                            checked={selectedSkills.includes(skill)}
                            onCheckedChange={() => toggleSkill(skill)}
                          />
                          <Label htmlFor={skill} className="text-sm">{skill}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Family Input Section */}
                  <FormField
                    control={form.control}
                    name="familyInput"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Family Input</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Include any relevant information shared by the family about this child's interests, experiences at home, or feedback..."
                            className="min-h-20"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Family perspectives add valuable context to portfolio entries
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* Standards Tab */}
              <TabsContent value="standards" className="space-y-4">
                <LearningStandardsDropdown
                  selectedStandards={form.watch('learningStandards')}
                  onSelectionChange={(standards) => form.setValue('learningStandards', standards)}
                  label="Learning Standards Alignment"
                  placeholder="Select applicable learning standards..."
                />

                {/* Tags Section */}
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="Add a tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" onClick={addTag} variant="outline">Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="accessLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Access Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select access level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="teacher">Teacher Only</SelectItem>
                          <SelectItem value="family">Share with Family</SelectItem>
                          <SelectItem value="school">Share with School</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Control who can view this portfolio entry
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-6">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Portfolio Entry'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}