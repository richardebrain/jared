// Comprehensive Video Library from CSV - Professional Development Videos
// These are authentic educational videos from your curriculum library

export interface CSVVideoResource {
  id: string;
  title: string;
  description: string;
  youtubeId: string;
  category: string[];
  tags: string[];
  duration: number;
  source: string;
  expertLevel: string;
  dateAdded: string;
  featured: boolean;
  citation: string;
  standards: string;
  practices: string;
  year: string;
}

// Key videos from your Assessment category
export const assessmentVideos: CSVVideoResource[] = [
  {
    id: "csv-video-001",
    title: "Developmental Surveillance: What, Why and How",
    description: "American Academy of Pediatrics Pediatrician, Dr. Shelly Flais discusses developmental surveillance recommendations, tips, and resources available to pediatricians, clinicians, and families.",
    youtubeId: "sceYLUHhgnU",
    category: ["Assessment", "Developmental Monitoring"],
    tags: ["assessment", "developmental-monitoring", "surveillance", "pediatrics", "professional-development"],
    duration: 8,
    source: "Professional Development Library",
    expertLevel: "intermediate",
    dateAdded: "2025-05-30",
    featured: true,
    citation: "American Academy of Pediatrics. (2018, May 21). Development Surveillance: What, Why and How [Video]. YouTube.",
    standards: "",
    practices: "",
    year: "2018"
  },
  {
    id: "csv-video-002",
    title: "McWilliam on RBI and Early Intervention",
    description: "Explanation of the evidence-based Routines Based Interview as a family assessment: supports families identify their children's needs and family-level needs.",
    youtubeId: "yhcUotSkYAY",
    category: ["Assessment", "IFSP or IEP Development"],
    tags: ["assessment", "ifsp", "iep", "early-intervention", "family-assessment"],
    duration: 15,
    source: "Professional Development Library",
    expertLevel: "advanced",
    dateAdded: "2025-05-30",
    featured: true,
    citation: "Amy Casey. (2012, December 20). McWilliam on RBI and Early Intervention [Video]. YouTube.",
    standards: "",
    practices: "",
    year: "2012"
  },
  {
    id: "csv-video-003",
    title: "What is Authentic Assessment?",
    description: "Practitioners and families share their perspective on authentic assessment. Illustrates the primary features and purposes of authentic assessment in a classroom setting.",
    youtubeId: "TmgrGdXAJJM",
    category: ["Assessment", "Authentic Assessment"],
    tags: ["assessment", "authentic-assessment", "classroom", "practitioners"],
    duration: 3,
    source: "Professional Development Library",
    expertLevel: "beginner",
    dateAdded: "2025-05-30",
    featured: true,
    citation: "Colorado Department of Education. (2021). What is Authentic Assessment? [Video]. YouTube.",
    standards: "4.1",
    practices: "A6",
    year: "2021"
  },
  {
    id: "csv-video-004",
    title: "Using Child Assessment Data to Achieve Positive Outcomes",
    description: "Administrators and teachers illustrate how they use authentic child assessment data to inform funders, inform classroom instruction, and meet the needs of individual children.",
    youtubeId: "PtR24V8z9_w",
    category: ["Assessment", "Authentic Assessment"],
    tags: ["assessment", "data", "outcomes", "classroom-instruction"],
    duration: 12,
    source: "Professional Development Library",
    expertLevel: "intermediate",
    dateAdded: "2025-05-30",
    featured: false,
    citation: "Colorado Department of Education. (2021). Using Child Assessment Data to Achieve Positive Outcomes [Video]. YouTube.",
    standards: "",
    practices: "",
    year: "2021"
  }
];

// Key videos from your Development category
export const developmentVideos: CSVVideoResource[] = [
  {
    id: "csv-video-005",
    title: "Understanding and Responding to Challenging Behaviors in Young Children",
    description: "A summary of Dr. Katherine Lingras's presentation on responding to challenging behaviors using two-generation and infant mental health frameworks.",
    youtubeId: "OaU7V_IEzi4",
    category: ["Development", "Self Regulation"],
    tags: ["development", "self-regulation", "challenging-behaviors", "mental-health"],
    duration: 45,
    source: "Professional Development Library",
    expertLevel: "advanced",
    dateAdded: "2025-05-30",
    featured: true,
    citation: "UMN Extension Dept. of Family, Health & Wellbeing. (2019, September 24). Understanding and Responding to Challenging Behaviors in Young Children [Video]. Youtube.",
    standards: "",
    practices: "",
    year: "2019"
  },
  {
    id: "csv-video-006",
    title: "The Secret Life of the Brain: The Baby's Brain",
    description: "Experts describe the fascinating development of a baby's brain in the first year of life.",
    youtubeId: "U0L0mYi_ftc",
    category: ["Development", "Early Learning and Development"],
    tags: ["development", "brain-development", "infants", "early-learning"],
    duration: 54,
    source: "Professional Development Library",
    expertLevel: "intermediate",
    dateAdded: "2025-05-30",
    featured: true,
    citation: "George Kalarritis, Clinical Psychologist. (2016, December 29). The Secret Life of the Brain (1 to 5) The Baby's Brain [Video]. YouTube.",
    standards: "1.2",
    practices: "",
    year: "2016"
  },
  {
    id: "csv-video-007",
    title: "How Childhood Trauma Affects Health Across a Lifetime",
    description: "Reviews how exposure to childhood trauma and adverse childhood experiences impacts brain development, the immune system and hormonal systems.",
    youtubeId: "95ovIJ3dsNk",
    category: ["Development", "Trauma"],
    tags: ["development", "trauma", "health", "adverse-childhood-experiences"],
    duration: 16,
    source: "Professional Development Library",
    expertLevel: "advanced",
    dateAdded: "2025-05-30",
    featured: true,
    citation: "TED. (2015, February 17). How Childhood Trauma Affects Health Across a Lifetime [Video]. YouTube.",
    standards: "1.3",
    practices: "",
    year: "2015"
  },
  {
    id: "csv-video-008",
    title: "Promoting Social Emotional Competence",
    description: "Provides a foundation for understanding the Pyramid Model as a framework for promoting young children's social and emotional development and preventing and addressing challenging behavior.",
    youtubeId: "zTl7rfcIhvM",
    category: ["Development", "Social Emotional"],
    tags: ["development", "social-emotional", "pyramid-model", "challenging-behavior"],
    duration: 4,
    source: "Professional Development Library",
    expertLevel: "beginner",
    dateAdded: "2025-05-30",
    featured: true,
    citation: "Pyramid Model. (2018, May 17). Promoting Social Emotional Competence [Video]. YouTube.",
    standards: "1.2",
    practices: "",
    year: "2018"
  }
];

// Combine all CSV video resources
export const csvVideoLibrary: CSVVideoResource[] = [
  ...assessmentVideos,
  ...developmentVideos
];

export default csvVideoLibrary;