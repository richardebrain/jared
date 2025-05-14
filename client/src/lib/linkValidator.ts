/**
 * Utility for validating internal application links
 * This helps identify 404 errors and broken navigation throughout the app
 */

/**
 * Interface for link information
 */
export interface LinkInfo {
  id: string;           // Unique identifier for the link
  path: string;         // The URL path (e.g., '/modules/5')
  label: string;        // Display text for the link
  source: string;       // Where this link is used (e.g., 'dashboard', 'header')
  requiredAuth: boolean; // Whether authentication is required
}

/**
 * Interface for validation results
 */
export interface ValidationResult {
  link: LinkInfo;
  valid: boolean;
  error?: string;
}

/**
 * Known application routes that should be valid
 */
export const applicationRoutes: string[] = [
  '/',
  '/login',
  '/register',
  '/dashboard',
  '/progression-map',
  '/assessment',
  '/learning-style',
  '/modules',
  '/discussions',
  '/core-values',
  '/mindful-mornings',
  '/storytelling-demo',
  '/core-values-shout-out',
  '/building-child',
  '/video-resources',
  '/tools'
];

/**
 * Pattern-based routes (routes with parameters)
 */
export const patternRoutes: {pattern: string, regex: RegExp}[] = [
  {
    pattern: '/modules/:id',
    regex: /^\/modules\/\d+$/
  },
  {
    pattern: '/micro-modules/:id',
    regex: /^\/micro-modules\/\d+$/
  },
  {
    pattern: '/discussions/:id',
    regex: /^\/discussions\/\d+$/
  }
];

/**
 * Check if a path is a valid application route
 * @param path The path to check
 * @returns boolean indicating if the path is valid
 */
export function isValidRoute(path: string): boolean {
  // Check exact matches
  if (applicationRoutes.includes(path)) {
    return true;
  }
  
  // Check pattern matches
  for (const patternRoute of patternRoutes) {
    if (patternRoute.regex.test(path)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Collect all links in the application with optional filtering
 * @param options Optional filtering options
 * @returns Array of link information
 */
export function collectLinks(options?: {source?: string}): LinkInfo[] {
  const allLinks: LinkInfo[] = [
    // Navbar/Header links
    { id: 'header-dashboard', path: '/dashboard', label: 'Dashboard', source: 'header', requiredAuth: true },
    { id: 'header-modules', path: '/modules', label: 'Modules', source: 'header', requiredAuth: true },
    { id: 'header-assessment', path: '/assessment', label: 'Assessment', source: 'header', requiredAuth: true },
    { id: 'header-tools', path: '/tools', label: 'Tools', source: 'header', requiredAuth: true },
    
    // Dashboard links
    { id: 'dash-modules', path: '/modules', label: 'Browse All Modules', source: 'dashboard', requiredAuth: true },
    { id: 'dash-assessment', path: '/assessment', label: 'Take Assessment Again', source: 'dashboard', requiredAuth: true },
    { id: 'dash-tools', path: '/tools', label: 'Teacher Tools', source: 'dashboard', requiredAuth: true },
    
    // Tools page links
    { id: 'tools-dashboard', path: '/dashboard', label: 'Back to Dashboard', source: 'tools', requiredAuth: true },
    
    // Modules page links
    { id: 'modules-dashboard', path: '/dashboard', label: 'Back to Dashboard', source: 'modules', requiredAuth: true },
    
    // Special case: dynamic module links
    // Note: These can't be fully validated without checking the database
    { id: 'dynamic-module', path: '/modules/1', label: 'Example Module', source: 'dynamic', requiredAuth: true },
    { id: 'dynamic-micro-module', path: '/micro-modules/1', label: 'Example Micro Module', source: 'dynamic', requiredAuth: true },
    
    // Discussion page links
    { id: 'discussions', path: '/discussions', label: 'Discussions', source: 'navigation', requiredAuth: true },
    { id: 'discussion-thread', path: '/discussions/1', label: 'Example Discussion Thread', source: 'dynamic', requiredAuth: true },
    
    // Special pages
    { id: 'learning-style', path: '/learning-style', label: 'Learning Style Assessment', source: 'navigation', requiredAuth: true },
    { id: 'core-values', path: '/core-values', label: 'Core Values', source: 'navigation', requiredAuth: true },
    { id: 'mindful-mornings', path: '/mindful-mornings', label: 'Mindful Mornings', source: 'navigation', requiredAuth: true },
    { id: 'storytelling-demo', path: '/storytelling-demo', label: 'Storytelling Demo', source: 'navigation', requiredAuth: true },
    { id: 'core-values-shout-out', path: '/core-values-shout-out', label: 'Core Values Shout Out', source: 'navigation', requiredAuth: true },
    { id: 'building-child', path: '/building-child', label: 'Building Child', source: 'navigation', requiredAuth: true },
    { id: 'video-resources', path: '/video-resources', label: 'Video Resources', source: 'navigation', requiredAuth: true },
    
    // Auth pages
    { id: 'login', path: '/login', label: 'Login', source: 'auth', requiredAuth: false },
    { id: 'register', path: '/register', label: 'Register', source: 'auth', requiredAuth: false },
    
    // Root
    { id: 'root', path: '/', label: 'Home', source: 'root', requiredAuth: false },
  ];
  
  // Apply filtering if options provided
  if (options?.source) {
    return allLinks.filter(link => link.source === options.source);
  }
  
  return allLinks;
}

/**
 * Validate links in the application
 * @param links Array of LinkInfo objects to validate
 * @returns Promise with validation results
 */
export async function validateLinks(links: LinkInfo[]): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];
  
  for (const link of links) {
    const isValid = isValidRoute(link.path);
    
    results.push({
      link,
      valid: isValid,
      error: isValid ? undefined : '404 - Route not found'
    });
  }
  
  return results;
}

/**
 * Finds all links in a component's JSX/TSX
 * @param componentPath Path to the component file
 * @returns Promise with array of found links
 */
export async function findLinksInComponent(componentPath: string): Promise<string[]> {
  try {
    // In a real implementation, this would read the file and parse it
    // For now, we'll just log the request and return an empty array
    console.log(`Request to analyze links in: ${componentPath}`);
    return [];
  } catch (error) {
    console.error(`Error analyzing links in ${componentPath}:`, error);
    return [];
  }
}

// Global functions for console usage
declare global {
  interface Window {
    validateAllLinks: () => Promise<ValidationResult[]>;
    checkLink: (path: string) => boolean;
  }
}

// Expose functions to global scope for browser console use
if (typeof window !== 'undefined') {
  window.validateAllLinks = async () => {
    const links = collectLinks();
    return await validateLinks(links);
  };
  
  window.checkLink = (path: string) => {
    return isValidRoute(path);
  };
}

export default {
  isValidRoute,
  collectLinks,
  validateLinks,
  findLinksInComponent
};