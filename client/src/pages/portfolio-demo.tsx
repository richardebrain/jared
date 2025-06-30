import PortfolioDisplay from '@/components/PortfolioDisplay';

// Sample data showing comprehensive NAEYC portfolio structure
const sampleChild = {
  id: 1,
  firstName: "Emma",
  lastName: "Smith",
  birthDate: "2020-03-15"
};

const samplePortfolioEntries = [
  {
    id: 1,
    title: "Building with Blocks",
    description: "Emma demonstrated problem-solving skills while constructing a tower",
    entryDate: "2024-12-15",
    entryType: "photograph",
    photoUrl: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400",
    teacherObservation: "Emma showed persistence when her first tower fell down. She analyzed what went wrong and adjusted her approach, building a more stable base.",
    behaviorObservation: "Stayed focused for 15 minutes, showed frustration briefly but self-regulated",
    socialInteraction: "Asked Jake for help with the tall pieces, demonstrated sharing and cooperation",
    developmentalDomain: ["Cognitive", "Social-Emotional", "Physical Development"],
    conversationTranscript: "Look, I made it really tall! It's taller than me!",
    milestoneAchieved: "Built structure taller than self using planning and problem-solving",
    skillsDemonstrated: ["Problem-solving", "Fine motor control", "Spatial reasoning", "Persistence"],
    learningStandards: ["AZ.SS.K.C4.1 - Problem solving and decision making"],
    eventType: "Learning Center Activity",
    eventDescription: "Free play time in the block center",
    tags: ["blocks", "construction", "problem-solving"]
  },
  {
    id: 2,
    title: "Letter Recognition Assessment",
    description: "Formal assessment of letter recognition and sound association",
    entryDate: "2024-12-10",
    entryType: "assessment",
    teacherObservation: "Emma correctly identified 18 out of 26 letters and knew 15 letter sounds",
    milestoneAchieved: "Demonstrates strong progress in literacy development",
    skillsDemonstrated: ["Letter recognition", "Phonemic awareness", "Visual discrimination"],
    developmentalDomain: ["Language and Literacy", "Cognitive"],
    learningStandards: ["AZ.ELA.RF.K.1 - Print concepts", "AZ.ELA.RF.K.3 - Phonics and word recognition"],
    tags: ["assessment", "literacy", "letters"]
  },
  {
    id: 3,
    title: "Family Field Trip to Farm",
    description: "Emma's family visited the farm and shared photos of her experiences",
    entryDate: "2024-12-05",
    entryType: "family_input",
    photoUrl: "https://images.unsplash.com/photo-1500076656116-558758c991c1?w=400",
    familyInput: "Emma was so excited to pet the goats! She counted all 12 chickens and remembered their names. She's been talking about becoming a farmer.",
    familyFeedback: "This experience really sparked her interest in animals and nature. She's been asking lots of questions about where food comes from.",
    eventType: "Family Experience",
    eventDescription: "Weekend visit to local farm with family",
    developmentalDomain: ["Science", "Mathematics", "Social-Emotional"],
    skillsDemonstrated: ["Counting", "Animal recognition", "Curiosity about nature"],
    tags: ["family", "farm", "animals", "counting"]
  },
  {
    id: 4,
    title: "Art: Rainbow Painting",
    description: "Self-directed artwork showing color knowledge and creativity",
    entryDate: "2024-12-01",
    entryType: "work_sample",
    photoUrl: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400",
    workSampleType: "Painting",
    workSampleDescription: "Emma painted a rainbow using proper color sequence and added clouds, sun, and flowers",
    teacherObservation: "Demonstrated knowledge of color order and showed fine motor control with brush",
    developmentalDomain: ["Creative Arts", "Physical Development", "Cognitive"],
    skillsDemonstrated: ["Color recognition", "Fine motor skills", "Creative expression", "Following patterns"],
    learningStandards: ["AZ.FA.CR.K.1 - Create artwork expressing ideas"],
    tags: ["art", "colors", "creativity", "painting"]
  },
  {
    id: 5,
    title: "Circle Time Leadership",
    description: "Emma volunteer to lead calendar time and help friends",
    entryDate: "2024-11-28",
    entryType: "observation",
    teacherObservation: "Emma confidently led the calendar routine, asking friends questions about days of the week and weather",
    behaviorObservation: "Showed leadership qualities, patience with younger children, and confidence speaking to group",
    socialInteraction: "Encouraged shy classmates to participate, showed kindness and inclusivity",
    conversationTranscript: "Who knows what day comes after Tuesday? That's right, Sarah! Wednesday!",
    developmentalDomain: ["Social-Emotional", "Language and Literacy", "Mathematics"],
    milestoneAchieved: "Demonstrates leadership and public speaking confidence",
    skillsDemonstrated: ["Leadership", "Public speaking", "Calendar concepts", "Encouraging others"],
    tags: ["leadership", "circle-time", "social-skills"]
  }
];

export default function PortfolioDemo() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            NAEYC Portfolio System Demo
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            This demonstration shows a comprehensive child portfolio following NAEYC and Head Start 
            documentation standards. The portfolio includes work samples, observations, family input, 
            assessments, and developmental tracking across all learning domains.
          </p>
        </div>
        
        <PortfolioDisplay 
          child={sampleChild}
          entries={samplePortfolioEntries}
          teacherName="Ms. Rodriguez"
          programName="Sunshine Early Learning Center"
          schoolYear="2024-2025"
        />
      </div>
    </div>
  );
}