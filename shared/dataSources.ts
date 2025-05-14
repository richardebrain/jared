/**
 * Data source management for the notebook LM plugin
 * 
 * This file defines the data source types and categories used by the
 * notebook LM plugin to restrict language models to only use data
 * from selected pools of information.
 */

// Data source categories
export enum DataSourceCategory {
  EDUCATIONAL = 'educational',
  CURRICULUM = 'curriculum', 
  ASSESSMENT = 'assessment',
  RESEARCH = 'research',
  PROFESSIONAL = 'professional',
  MEDIA = 'media',
  CUSTOM = 'custom'
}

// Data source interface
export interface DataSource {
  id: string;
  name: string;
  description: string;
  url?: string;
  category: DataSourceCategory;
  tags: string[];
  enabled: boolean;
  isCustom: boolean;
}

// Default educational data sources
export const defaultEducationalSources: DataSource[] = [
  {
    id: 'naeyc',
    name: 'NAEYC Resources',
    description: 'National Association for the Education of Young Children standards and resources',
    url: 'https://www.naeyc.org',
    category: DataSourceCategory.EDUCATIONAL,
    tags: ['standards', 'best practices', 'early childhood'],
    enabled: true,
    isCustom: false
  },
  {
    id: 'ecers',
    name: 'ECERS Assessment Framework',
    description: 'Early Childhood Environment Rating Scale resources and guidelines',
    url: 'https://ers.fpg.unc.edu',
    category: DataSourceCategory.ASSESSMENT,
    tags: ['assessment', 'environment', 'quality rating'],
    enabled: true,
    isCustom: false
  },
  {
    id: 'class',
    name: 'CLASS Framework',
    description: 'Classroom Assessment Scoring System resources and guidelines',
    url: 'https://teachstone.com/class',
    category: DataSourceCategory.ASSESSMENT,
    tags: ['assessment', 'teacher-child interactions', 'quality rating'],
    enabled: true,
    isCustom: false
  },
  {
    id: 'raising-arizona-handbook',
    name: 'Raising Arizona Handbook',
    description: 'Official Raising Arizona Preschool handbook and materials',
    category: DataSourceCategory.CURRICULUM,
    tags: ['handbook', 'policies', 'procedures', 'core values'],
    enabled: true,
    isCustom: false
  },
  {
    id: 'conscious-discipline',
    name: 'Conscious Discipline',
    description: 'Evidence-based social and emotional learning methodology',
    url: 'https://consciousdiscipline.com',
    category: DataSourceCategory.CURRICULUM,
    tags: ['social-emotional', 'classroom management', 'self-regulation'],
    enabled: true,
    isCustom: false
  },
  {
    id: 'highscope',
    name: 'HighScope Curriculum',
    description: 'Active learning educational approach',
    url: 'https://highscope.org',
    category: DataSourceCategory.CURRICULUM,
    tags: ['curriculum', 'active learning', 'child-centered'],
    enabled: true,
    isCustom: false
  },
  {
    id: 'head-start',
    name: 'Head Start Framework',
    description: 'Early Learning Outcomes Framework and resources',
    url: 'https://eclkc.ohs.acf.hhs.gov',
    category: DataSourceCategory.EDUCATIONAL,
    tags: ['framework', 'outcomes', 'standards'],
    enabled: true,
    isCustom: false
  },
  {
    id: 'zero-to-three',
    name: 'Zero to Three',
    description: 'Resources for infant and toddler development',
    url: 'https://zerotothree.org',
    category: DataSourceCategory.RESEARCH,
    tags: ['infant', 'toddler', 'development'],
    enabled: true,
    isCustom: false
  },
  {
    id: 'mindful-mornings',
    name: 'Mindful Mornings',
    description: 'Raising Arizona mindfulness practices and core values',
    category: DataSourceCategory.CURRICULUM,
    tags: ['mindfulness', 'core values', 'social-emotional'],
    enabled: true,
    isCustom: false
  },
  {
    id: 'building-chapter-one',
    name: 'Building Chapter One',
    description: 'Raising Arizona philosophy of building Chapter One into each child',
    category: DataSourceCategory.CURRICULUM,
    tags: ['philosophy', 'development', 'core values'],
    enabled: true,
    isCustom: false
  }
];