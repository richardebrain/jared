/**
 * Data Sources Management System
 * 
 * This file defines the authorized data sources that can be used
 * by the language model when generating content.
 */

/**
 * Interface for a data source
 */
export interface DataSource {
  id: string;
  name: string;
  description: string;
  category: DataSourceCategory;
  url?: string;
  tags: string[];
  enabled: boolean;
}

/**
 * Data source categories
 */
export enum DataSourceCategory {
  EDUCATIONAL = 'educational',
  ASSESSMENT = 'assessment',
  CURRICULUM = 'curriculum',
  RESEARCH = 'research',
  PROFESSIONAL = 'professional',
  MEDIA = 'media',
  CUSTOM = 'custom'
}

/**
 * List of authorized educational data sources
 */
export const authorizedSources: DataSource[] = [
  // Educational Organizations
  {
    id: 'naeyc',
    name: 'National Association for the Education of Young Children',
    description: 'Professional organization that promotes excellence in early childhood education',
    category: DataSourceCategory.EDUCATIONAL,
    url: 'https://www.naeyc.org',
    tags: ['early childhood', 'professional development', 'standards'],
    enabled: true
  },
  {
    id: 'zero-to-three',
    name: 'ZERO TO THREE',
    description: 'National nonprofit organization focused on infant and toddler development',
    category: DataSourceCategory.EDUCATIONAL,
    url: 'https://www.zerotothree.org',
    tags: ['infant', 'toddler', 'development', 'research'],
    enabled: true
  },
  {
    id: 'head-start',
    name: 'Head Start ECLKC',
    description: 'Early Childhood Learning and Knowledge Center',
    category: DataSourceCategory.EDUCATIONAL,
    url: 'https://eclkc.ohs.acf.hhs.gov',
    tags: ['early childhood', 'federal program', 'resources'],
    enabled: true
  },
  
  // Curriculum Resources
  {
    id: 'creative-curriculum',
    name: 'The Creative Curriculum',
    description: 'Research-based curriculum approach for early childhood education',
    category: DataSourceCategory.CURRICULUM,
    tags: ['curriculum', 'developmentally appropriate', 'framework'],
    enabled: true
  },
  {
    id: 'highscope',
    name: 'HighScope',
    description: 'Active learning educational approach for early childhood',
    category: DataSourceCategory.CURRICULUM,
    url: 'https://highscope.org',
    tags: ['curriculum', 'active learning', 'plan-do-review'],
    enabled: true
  },
  {
    id: 'conscious-discipline',
    name: 'Conscious Discipline',
    description: 'Comprehensive classroom management program and social-emotional curriculum',
    category: DataSourceCategory.CURRICULUM,
    url: 'https://consciousdiscipline.com',
    tags: ['social-emotional', 'classroom management', 'brain-based'],
    enabled: true
  },
  
  // Assessment Tools
  {
    id: 'iters',
    name: 'Infant/Toddler Environment Rating Scale (ITERS)',
    description: 'Assessment tool for evaluating infant and toddler care settings',
    category: DataSourceCategory.ASSESSMENT,
    tags: ['assessment', 'environment', 'quality'],
    enabled: true
  },
  {
    id: 'ecers',
    name: 'Early Childhood Environment Rating Scale (ECERS)',
    description: 'Assessment tool for evaluating early childhood environments',
    category: DataSourceCategory.ASSESSMENT,
    tags: ['assessment', 'environment', 'quality'],
    enabled: true
  },
  {
    id: 'class',
    name: 'Classroom Assessment Scoring System (CLASS)',
    description: 'Observation tool for assessing classroom quality',
    category: DataSourceCategory.ASSESSMENT,
    url: 'https://teachstone.com/class',
    tags: ['assessment', 'teacher-child interactions', 'quality'],
    enabled: true
  },
  
  // Research Resources
  {
    id: 'cdc-early',
    name: 'CDC Learn the Signs. Act Early',
    description: 'CDC resources on child development milestones',
    category: DataSourceCategory.RESEARCH,
    url: 'https://www.cdc.gov/ncbddd/actearly',
    tags: ['development', 'milestones', 'screening'],
    enabled: true
  },
  {
    id: 'harvard-center',
    name: 'Harvard Center on the Developing Child',
    description: 'Research on early childhood development and policy',
    category: DataSourceCategory.RESEARCH,
    url: 'https://developingchild.harvard.edu',
    tags: ['brain development', 'research', 'policy'],
    enabled: true
  },
  
  // Professional Development
  {
    id: 'pbs-teachers',
    name: 'PBS Teachers',
    description: 'Educational resources from PBS',
    category: DataSourceCategory.PROFESSIONAL,
    url: 'https://az.pbslearningmedia.org',
    tags: ['resources', 'media', 'activities'],
    enabled: true
  },
  
  // Media Resources
  {
    id: 'raising-arizona-preschool',
    name: 'Raising Arizona Preschool',
    description: 'Custom content from Raising Arizona Preschool',
    category: DataSourceCategory.MEDIA,
    tags: ['raising arizona', 'custom', 'philosophy'],
    enabled: true
  }
];

/**
 * Custom data sources added by the organization
 */
export const customSources: DataSource[] = [];

/**
 * Get all enabled data sources
 */
export function getEnabledDataSources(): DataSource[] {
  return [...authorizedSources, ...customSources].filter(source => source.enabled);
}

/**
 * Get data sources by category
 */
export function getDataSourcesByCategory(category: DataSourceCategory): DataSource[] {
  return getEnabledDataSources().filter(source => source.category === category);
}

/**
 * Get data sources by tags
 */
export function getDataSourcesByTags(tags: string[]): DataSource[] {
  if (!tags || tags.length === 0) return getEnabledDataSources();
  
  return getEnabledDataSources().filter(source => 
    tags.some(tag => source.tags.includes(tag))
  );
}

/**
 * Add a custom data source
 */
export function addCustomDataSource(source: Omit<DataSource, 'id' | 'category'>): DataSource {
  const newSource: DataSource = {
    ...source,
    id: `custom-${Date.now()}`,
    category: DataSourceCategory.CUSTOM,
    enabled: true
  };
  
  customSources.push(newSource);
  return newSource;
}

/**
 * Toggle data source enabled status
 */
export function toggleDataSourceStatus(sourceId: string, enabled: boolean): boolean {
  // Try to find in authorized sources
  const authSource = authorizedSources.find(s => s.id === sourceId);
  if (authSource) {
    authSource.enabled = enabled;
    return true;
  }
  
  // Try to find in custom sources
  const customSource = customSources.find(s => s.id === sourceId);
  if (customSource) {
    customSource.enabled = enabled;
    return true;
  }
  
  return false;
}