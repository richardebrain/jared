/**
 * Expanded Video Resources Library
 * Integrated from the comprehensive CSV library provided
 */

export interface VideoResource {
  id: string;
  title: string;
  description: string;
  url: string;
  videoId?: string;
  duration: string;
  category: string;
  subcategory: string;
  year: string;
  citation: string;
  standards: string;
  practices: string;
  tags: string[];
}

// Assessment Videos
export const assessmentVideos: VideoResource[] = [
  {
    id: "assessment-001",
    title: "Developmental Surveillance: What, Why and How",
    description: "American Academy of Pediatrics Pediatrician, Dr. Shelly Flais discusses developmental surveillance recommendations, tips, and resources available to pediatricians, clinicians, and families.",
    url: "https://www.youtube.com/watch?v=sceYLUHhgnU",
    videoId: "sceYLUHhgnU",
    duration: "N/A",
    category: "Assessment",
    subcategory: "Developmental Monitoring",
    year: "2018",
    citation: "American Academy of Pediatrics. (2018, May 21). Development Surveillance: What, Why and How [Video]. YouTube.",
    standards: "",
    practices: "",
    tags: ["assessment", "developmental-monitoring", "surveillance", "pediatrics"]
  },
  {
    id: "assessment-002", 
    title: "McWilliam on RBI and Early Intervention",
    description: "Explanation of the evidence-based Routines Based Interview as a family assessment: supports families identify their children's needs and family-level needs.",
    url: "https://www.youtube.com/watch?v=yhcUotSkYAY",
    videoId: "yhcUotSkYAY",
    duration: "N/A",
    category: "Assessment",
    subcategory: "IFSP or IEP Development", 
    year: "2012",
    citation: "Amy Casey. (2012, December 20). McWilliam on RBI and Early Intervention [Video]. YouTube.",
    standards: "",
    practices: "",
    tags: ["assessment", "ifsp", "iep", "early-intervention", "family-assessment"]
  },
  {
    id: "assessment-003",
    title: "What is Authentic Assessment?",
    description: "Practitioners and families share their perspective on authentic assessment. Illustrates the primary features and purposes of authentic assessment in a classroom setting.",
    url: "https://www.youtube.com/watch?v=TmgrGdXAJJM",
    videoId: "TmgrGdXAJJM",
    duration: "3:02",
    category: "Assessment",
    subcategory: "Authentic Assessment",
    year: "2021",
    citation: "Colorado Department of Education. (2021). What is Authentic Assessment? [Video]. YouTube.",
    standards: "4.1",
    practices: "A6",
    tags: ["assessment", "authentic-assessment", "classroom", "practitioners"]
  },
  {
    id: "assessment-004",
    title: "Using Child Assessment Data to Achieve Positive Outcomes",
    description: "Administrators and teachers illustrate how they use authentic child assessment data to inform funders, inform classroom instruction, and meet the needs of individual children.",
    url: "https://www.youtube.com/watch?v=PtR24V8z9_w",
    videoId: "PtR24V8z9_w",
    duration: "N/A",
    category: "Assessment",
    subcategory: "Authentic Assessment",
    year: "2021",
    citation: "Colorado Department of Education. (2021). Using Child Assessment Data to Achieve Positive Outcomes [Video]. YouTube.",
    standards: "",
    practices: "",
    tags: ["assessment", "data", "outcomes", "classroom-instruction"]
  }
];

// Development Videos
export const developmentVideos: VideoResource[] = [
  {
    id: "development-001",
    title: "Understanding and Responding to Challenging Behaviors in Young Children",
    description: "A summary of Dr. Katherine Lingras's presentation on responding to challenging behaviors using two-generation and infant mental health frameworks.",
    url: "https://www.youtube.com/watch?v=OaU7V_IEzi4",
    videoId: "OaU7V_IEzi4",
    duration: "N/A",
    category: "Development",
    subcategory: "Self Regulation",
    year: "2019",
    citation: "UMN Extension Dept. of Family, Health & Wellbeing. (2019, September 24). Understanding and Responding to Challenging Behaviors in Young Children [Video]. Youtube.",
    standards: "",
    practices: "",
    tags: ["development", "self-regulation", "challenging-behaviors", "mental-health"]
  },
  {
    id: "development-002",
    title: "The Secret Life of the Brain: The Baby's Brain",
    description: "Experts describe the fascinating development of a baby's brain in the first year of life.",
    url: "https://www.youtube.com/watch?v=U0L0mYi_ftc",
    videoId: "U0L0mYi_ftc",
    duration: "54:28",
    category: "Development",
    subcategory: "Early Learning and Development",
    year: "2016",
    citation: "George Kalarritis, Clinical Psychologist. (2016, December 29). The Secret Life of the Brain (1 to 5) The Baby's Brain [Video]. YouTube.",
    standards: "1.2",
    practices: "",
    tags: ["development", "brain-development", "infants", "early-learning"]
  },
  {
    id: "development-003",
    title: "InBrief: The Science of Early Childhood Development",
    description: "Dr. Jack Shonkoff explains the interplay between experience and brain development.",
    url: "https://developingchild.harvard.edu/resources/inbrief-the-science-of-early-childhood-development/",
    videoId: "",
    duration: "3:57",
    category: "Development", 
    subcategory: "Early Learning and Development",
    year: "2007",
    citation: "Center on the Developing Child Harvard University. (2007). InBrief: The Science of Early Childhood Development [Video].",
    standards: "1.2",
    practices: "",
    tags: ["development", "brain-development", "science", "harvard"]
  },
  {
    id: "development-004",
    title: "InBrief: Executive Function: Skills for Life and Learning",
    description: "Describes the importance of executive functioning (inhibitory control, working memory, and mental flexibility) and how it develops in the early years.",
    url: "https://developingchild.harvard.edu/resources/inbrief-executive-function-skills-for-life-and-learning/",
    videoId: "",
    duration: "5:35",
    category: "Development",
    subcategory: "Early Learning and Development", 
    year: "2012",
    citation: "Center on the Developing Child Harvard University, National Scientific Council on the Developing Child & National Forum on Early Childhood Policy and Program. (2012).",
    standards: "1.2",
    practices: "",
    tags: ["development", "executive-function", "learning", "harvard"]
  }
];

// Combine all video resources
export const expandedVideoResources: VideoResource[] = [
  ...assessmentVideos,
  ...developmentVideos
];

// Helper function to find relevant videos by topic
export function findVideosByTopic(topic: string): VideoResource[] {
  const searchTerm = topic.toLowerCase();
  return expandedVideoResources.filter(video => 
    video.tags.some(tag => tag.includes(searchTerm)) ||
    video.category.toLowerCase().includes(searchTerm) ||
    video.subcategory.toLowerCase().includes(searchTerm) ||
    video.title.toLowerCase().includes(searchTerm) ||
    video.description.toLowerCase().includes(searchTerm)
  );
}

// Helper function to get videos by category
export function getVideosByCategory(category: string): VideoResource[] {
  return expandedVideoResources.filter(video => 
    video.category.toLowerCase() === category.toLowerCase()
  );
}

export default expandedVideoResources;