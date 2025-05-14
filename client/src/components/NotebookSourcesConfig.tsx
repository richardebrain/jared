import React, { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { DataSource, DataSourceCategory } from '@shared/dataSources';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { 
  Check, AlertTriangle, BookOpen, School, Film, 
  ClipboardList, Microscope, GraduationCap, Plus,
  Save, Undo, Filter
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Create form schema for custom data source
const customSourceSchema = z.object({
  name: z.string().min(3, {
    message: "Name must be at least 3 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  url: z.string().url({
    message: "Please enter a valid URL.",
  }).optional(),
  tags: z.string().transform(val => val.split(',').map(tag => tag.trim())),
});

// Form schema for plugin config
const configSchema = z.object({
  useStrictMode: z.boolean(),
  allowGeneralKnowledge: z.boolean(),
  relevanceThreshold: z.number().min(0).max(1),
});

type ConfigFormValues = z.infer<typeof configSchema>;
type CustomSourceFormValues = z.infer<typeof customSourceSchema>;

interface NotebookSourcesConfigProps {
  isAdmin?: boolean;
}

export default function NotebookSourcesConfig({ isAdmin = false }: NotebookSourcesConfigProps) {
  const { toast } = useToast();
  const [sources, setSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [config, setConfig] = useState({
    useStrictMode: true,
    prioritizedSources: [] as string[],
    excludedSources: [] as string[],
    allowGeneralKnowledge: false,
    requiredSources: [] as string[],
    relevanceThreshold: 0.7,
    categories: [] as DataSourceCategory[],
    tags: [] as string[]
  });

  // Initialize form for plugin config
  const configForm = useForm<ConfigFormValues>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      useStrictMode: config.useStrictMode,
      allowGeneralKnowledge: config.allowGeneralKnowledge,
      relevanceThreshold: config.relevanceThreshold,
    },
  } as any);

  // Initialize form for adding custom source
  const customSourceForm = useForm<CustomSourceFormValues>({
    resolver: zodResolver(customSourceSchema),
    defaultValues: {
      name: '',
      description: '',
      url: '',
      tags: '',
    },
  } as any);

  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const sourcesResponse = await apiRequest<DataSource[]>('/api/notebook-lm/sources');
        const configResponse = await apiRequest('/api/notebook-lm/config');
        
        setSources(sourcesResponse);
        setConfig(configResponse);
        
        // Update form defaults
        configForm.reset({
          useStrictMode: configResponse.useStrictMode,
          allowGeneralKnowledge: configResponse.allowGeneralKnowledge,
          relevanceThreshold: configResponse.relevanceThreshold,
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching notebook LM data:', error);
        toast({
          title: 'Failed to load data sources',
          description: 'There was an error loading the data source configuration.',
          variant: 'destructive',
        });
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter sources based on category and search
  const filteredSources = sources.filter(source => {
    // Filter by category
    if (selectedCategory !== 'all' && source.category !== selectedCategory) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        source.name.toLowerCase().includes(query) ||
        source.description.toLowerCase().includes(query) ||
        source.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    return true;
  });

  // Toggle source status
  const toggleSourceStatus = async (sourceId: string, enabled: boolean) => {
    try {
      await apiRequest('/api/notebook-lm/sources/toggle', {
        method: 'POST',
        data: { sourceId, enabled }
      });
      
      // Update local state
      setSources(prevSources => 
        prevSources.map(source => 
          source.id === sourceId 
            ? { ...source, enabled } 
            : source
        )
      );
      
      toast({
        title: `Source ${enabled ? 'enabled' : 'disabled'}`,
        description: `The data source has been ${enabled ? 'enabled' : 'disabled'} successfully.`,
      });
    } catch (error) {
      console.error('Error toggling source status:', error);
      toast({
        title: 'Operation failed',
        description: 'There was an error updating the data source status.',
        variant: 'destructive',
      });
    }
  };

  // Toggle required source
  const toggleRequiredSource = (sourceId: string) => {
    const isRequired = config.requiredSources.includes(sourceId);
    
    setConfig(prev => {
      const newRequiredSources = isRequired
        ? prev.requiredSources.filter(id => id !== sourceId)
        : [...prev.requiredSources, sourceId];
        
      return {
        ...prev,
        requiredSources: newRequiredSources
      };
    });
  };

  // Toggle prioritized source  
  const togglePrioritizedSource = (sourceId: string) => {
    const isPrioritized = config.prioritizedSources.includes(sourceId);
    
    setConfig(prev => {
      const newPrioritizedSources = isPrioritized
        ? prev.prioritizedSources.filter(id => id !== sourceId)
        : [...prev.prioritizedSources, sourceId];
        
      return {
        ...prev,
        prioritizedSources: newPrioritizedSources
      };
    });
  };

  // Toggle excluded source
  const toggleExcludedSource = (sourceId: string) => {
    const isExcluded = config.excludedSources.includes(sourceId);
    
    setConfig(prev => {
      const newExcludedSources = isExcluded
        ? prev.excludedSources.filter(id => id !== sourceId)
        : [...prev.excludedSources, sourceId];
        
      return {
        ...prev,
        excludedSources: newExcludedSources
      };
    });
  };

  // Update configuration
  const saveConfig = async (values: ConfigFormValues) => {
    try {
      const updatedConfig = {
        ...config,
        useStrictMode: values.useStrictMode,
        allowGeneralKnowledge: values.allowGeneralKnowledge,
        relevanceThreshold: values.relevanceThreshold
      };
      
      await apiRequest('/api/notebook-lm/config', {
        method: 'POST',
        data: updatedConfig
      });
      
      setConfig(updatedConfig);
      
      toast({
        title: 'Configuration saved',
        description: 'The notebook LM configuration has been updated successfully.',
      });
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast({
        title: 'Failed to save configuration',
        description: 'There was an error updating the notebook LM configuration.',
        variant: 'destructive',
      });
    }
  };

  // Reset configuration
  const resetConfigToDefaults = async () => {
    try {
      const defaultConfig = await apiRequest('/api/notebook-lm/config/reset', {
        method: 'POST',
      });
      
      setConfig(defaultConfig);
      
      // Update form values
      configForm.reset({
        useStrictMode: defaultConfig.useStrictMode,
        allowGeneralKnowledge: defaultConfig.allowGeneralKnowledge,
        relevanceThreshold: defaultConfig.relevanceThreshold,
      });
      
      toast({
        title: 'Configuration reset',
        description: 'The notebook LM configuration has been reset to defaults.',
      });
    } catch (error) {
      console.error('Error resetting configuration:', error);
      toast({
        title: 'Failed to reset configuration',
        description: 'There was an error resetting the notebook LM configuration.',
        variant: 'destructive',
      });
    }
  };

  // Add custom source
  const addCustomSource = async (values: CustomSourceFormValues) => {
    try {
      const newSource = await apiRequest<DataSource>('/api/notebook-lm/sources/custom', {
        method: 'POST',
        body: JSON.stringify({
          name: values.name,
          description: values.description,
          url: values.url,
          tags: values.tags,
        }),
      });
      
      setSources(prev => [...prev, newSource]);
      
      // Reset form
      customSourceForm.reset({
        name: '',
        description: '',
        url: '',
        tags: '',
      });
      
      toast({
        title: 'Custom source added',
        description: 'Your custom data source has been added successfully.',
      });
    } catch (error) {
      console.error('Error adding custom source:', error);
      toast({
        title: 'Failed to add custom source',
        description: 'There was an error adding the custom data source.',
        variant: 'destructive',
      });
    }
  };

  // Get icon for category
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case DataSourceCategory.EDUCATIONAL: return <School className="h-4 w-4" />;
      case DataSourceCategory.CURRICULUM: return <BookOpen className="h-4 w-4" />;
      case DataSourceCategory.ASSESSMENT: return <ClipboardList className="h-4 w-4" />;
      case DataSourceCategory.RESEARCH: return <Microscope className="h-4 w-4" />;
      case DataSourceCategory.PROFESSIONAL: return <GraduationCap className="h-4 w-4" />;
      case DataSourceCategory.MEDIA: return <Film className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Notebook LM Data Sources</h2>
            <p className="text-muted-foreground">
              Configure which data sources can be used by the AI when generating content.
            </p>
          </div>
        </div>

        <Tabs defaultValue="sources" className="w-full">
          <TabsList className="grid w-full md:w-[400px] grid-cols-2">
            <TabsTrigger value="sources">Data Sources</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          {/* DATA SOURCES TAB */}
          <TabsContent value="sources">
            <div className="grid gap-4">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex gap-2">
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {Object.values(DataSourceCategory).map((category) => (
                        <SelectItem key={category} value={category}>
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(category)}
                            <span>{category.charAt(0).toUpperCase() + category.slice(1)}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="relative">
                    <Input
                      placeholder="Search sources..."
                      className="w-[200px] pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Filter className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                
                {loading ? (
                  <div>Loading...</div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    {filteredSources.length} data sources found
                  </div>
                )}
              </div>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredSources.map((source) => (
                  <Card key={source.id} className={`overflow-hidden ${!source.enabled ? 'opacity-70' : ''}`}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <CardTitle className="text-lg">{source.name}</CardTitle>
                          <div className="flex items-center gap-1 mt-1">
                            {getCategoryIcon(source.category)}
                            <span className="text-xs text-muted-foreground capitalize">
                              {source.category}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {config.requiredSources.includes(source.id) && (
                            <Badge className="bg-blue-500" title="Required Source">R</Badge>
                          )}
                          
                          {config.prioritizedSources.includes(source.id) && (
                            <Badge className="bg-green-500" title="Prioritized Source">P</Badge>
                          )}
                          
                          {config.excludedSources.includes(source.id) && (
                            <Badge className="bg-red-500" title="Excluded Source">X</Badge>
                          )}
                          
                          <Switch
                            checked={source.enabled}
                            onCheckedChange={(checked) => toggleSourceStatus(source.id, checked)}
                            aria-label={`Toggle ${source.name}`}
                          />
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pb-2">
                      <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                        {source.description}
                      </CardDescription>
                      
                      <div className="flex flex-wrap gap-1 mt-2">
                        {source.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      
                      {source.url && (
                        <div className="mt-2">
                          <a 
                            href={source.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:underline"
                          >
                            {source.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                          </a>
                        </div>
                      )}
                    </CardContent>
                    
                    <CardFooter className="pt-2">
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant={config.requiredSources.includes(source.id) ? "default" : "outline"}
                          className="flex-1"
                          onClick={() => toggleRequiredSource(source.id)}
                          title="Mark as required source"
                        >
                          Required
                        </Button>
                        
                        <Button 
                          size="sm" 
                          variant={config.prioritizedSources.includes(source.id) ? "default" : "outline"}
                          className="flex-1"
                          onClick={() => togglePrioritizedSource(source.id)}
                          title="Mark as prioritized source"
                        >
                          Prioritize
                        </Button>
                        
                        <Button 
                          size="sm" 
                          variant={config.excludedSources.includes(source.id) ? "destructive" : "outline"}
                          className="flex-1"
                          onClick={() => toggleExcludedSource(source.id)}
                          title="Exclude this source"
                        >
                          {config.excludedSources.includes(source.id) ? "Excluded" : "Exclude"}
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
              
              {isAdmin && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-xl">Add Custom Data Source</CardTitle>
                    <CardDescription>
                      Add your own custom data sources to be used by the AI system.
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <Form {...customSourceForm}>
                      <form onSubmit={customSourceForm.handleSubmit(addCustomSource)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={customSourceForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Source Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter source name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={customSourceForm.control}
                            name="url"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>URL (Optional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="https://example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={customSourceForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Input placeholder="Describe this data source" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={customSourceForm.control}
                          name="tags"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tags</FormLabel>
                              <FormControl>
                                <Input placeholder="early childhood, development, etc." {...field} />
                              </FormControl>
                              <FormDescription>
                                Enter tags separated by commas
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button type="submit" className="mt-2">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Custom Source
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
          
          {/* SETTINGS TAB */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Notebook LM Plugin Settings</CardTitle>
                <CardDescription>
                  Configure how the language model uses data sources when generating content.
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <Form {...configForm}>
                  <form onSubmit={configForm.handleSubmit(saveConfig)} className="space-y-6">
                    <FormField
                      control={configForm.control}
                      name="useStrictMode"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Strict Mode</FormLabel>
                            <FormDescription>
                              Only use information explicitly from allowed sources
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={configForm.control}
                      name="allowGeneralKnowledge"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Allow General Knowledge</FormLabel>
                            <FormDescription>
                              Allow the model to use general knowledge in addition to specified sources
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={!configForm.watch("useStrictMode")}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={configForm.control}
                      name="relevanceThreshold"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel>Relevance Threshold</FormLabel>
                          <div className="flex items-center gap-4">
                            <FormControl>
                              <Input
                                type="range"
                                min={0}
                                max={1}
                                step={0.1}
                                className="w-full"
                                value={field.value}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <span className="w-12">{field.value.toFixed(1)}</span>
                          </div>
                          <FormDescription>
                            How relevant sources need to be for inclusion (0.0 = low, 1.0 = high)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-between pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetConfigToDefaults}
                      >
                        <Undo className="h-4 w-4 mr-2" />
                        Reset to Defaults
                      </Button>
                      
                      <Button type="submit">
                        <Save className="h-4 w-4 mr-2" />
                        Save Settings
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}