/**
 * Script to fix existing module structure and create proper section navigation
 */

async function fixModuleStructure() {
  try {
    // Get the latest module (ID 38 from the database query)
    const response = await fetch('http://localhost:5000/api/modules/38');
    const module = await response.json();
    
    console.log('Current module:', {
      id: module.id,
      title: module.title,
      contentLength: module.content?.length || 0
    });
    
    // Parse the existing content and restructure it properly
    let sections = [];
    try {
      const parsedContent = JSON.parse(module.content);
      if (Array.isArray(parsedContent)) {
        sections = parsedContent;
      }
    } catch (e) {
      console.log('Content parsing failed, creating new structure');
    }
    
    // Create properly structured sections for ECERS module
    const properSections = [
      {
        id: "intro",
        type: "text",
        title: "ECERS Assessment Overview",
        content: `The Early Childhood Environment Rating Scale (ECERS-3) is a comprehensive assessment tool designed to evaluate the quality of early childhood programs. Understanding this assessment is crucial for maintaining high-quality educational environments.

**Key Areas Evaluated:**
• Space and Furnishings
• Personal Care Routines  
• Language and Literacy
• Learning Activities
• Interaction
• Program Structure
• Parents and Staff

This deep-dive workshop will prepare you for every aspect of the ECERS assessment process.`,
        duration: 8,
        required: true
      },
      {
        id: "preparation",
        type: "text", 
        title: "Assessment Preparation Strategies",
        content: `Successful ECERS preparation requires systematic planning and attention to detail. Here are proven strategies to ensure readiness:

**Before the Assessment:**
1. Review all ECERS-3 indicators and criteria
2. Conduct a self-assessment using the official checklist
3. Document current practices and identify improvement areas
4. Organize materials and ensure proper accessibility
5. Train staff on assessment expectations

**Environmental Preparation:**
• Ensure learning centers are well-organized and stocked
• Check that materials are age-appropriate and accessible
• Verify safety protocols are visible and followed
• Organize documentation and portfolios systematically

**Staff Preparation:**
• Review interaction guidelines and best practices
• Practice positive behavior guidance techniques
• Ensure understanding of program philosophy and goals`,
        duration: 10,
        required: true
      },
      {
        id: "quiz1",
        type: "quiz",
        title: "ECERS Knowledge Assessment",
        duration: 12,
        questions: [
          {
            question: "What is the primary purpose of the ECERS-3 assessment?",
            answers: [
              "To evaluate the quality of early childhood learning environments",
              "To test children's academic performance",
              "To assess teacher qualifications only",
              "To determine program funding eligibility"
            ],
            correctAnswer: 0,
            explanation: "ECERS-3 is specifically designed to evaluate the overall quality of early childhood environments, including physical space, interactions, and programming."
          },
          {
            question: "Which strategy is most effective for ECERS preparation?",
            answers: [
              "Making changes only on assessment day",
              "Conducting regular self-assessments and making gradual improvements",
              "Focusing solely on physical environment changes",
              "Limiting children's activities during assessment"
            ],
            correctAnswer: 1,
            explanation: "Regular self-assessment and continuous improvement ensure authentic, sustainable quality rather than superficial changes for assessment day."
          },
          {
            question: "How many main subscales does ECERS-3 evaluate?",
            answers: [
              "5 subscales",
              "6 subscales", 
              "7 subscales",
              "8 subscales"
            ],
            correctAnswer: 2,
            explanation: "ECERS-3 evaluates 7 main subscales: Space and Furnishings, Personal Care Routines, Language and Literacy, Learning Activities, Interaction, Program Structure, and Parents and Staff."
          }
        ],
        required: true
      },
      {
        id: "implementation",
        type: "text",
        title: "Implementation Best Practices",
        content: `Implementing quality improvements for ECERS success requires ongoing commitment and strategic planning.

**Quality Indicators to Focus On:**

**Space and Furnishings:**
• Adequate space for various activities
• Child-accessible storage and materials
• Soft furnishings and comfortable areas
• Appropriate lighting and ventilation

**Learning Activities:**
• Diverse, developmentally appropriate materials
• Well-organized learning centers
• Evidence of children's work and interests
• Regular rotation and updating of activities

**Interaction Quality:**
• Warm, responsive teacher-child interactions
• Positive guidance strategies
• Encouragement of peer relationships
• Respect for individual differences

**Program Structure:**
• Balanced daily schedule
• Smooth transitions between activities
• Appropriate group sizes
• Flexible programming to meet individual needs`,
        duration: 15,
        required: true
      },
      {
        id: "final-assessment",
        type: "quiz",
        title: "Implementation Mastery Check",
        duration: 10,
        questions: [
          {
            question: "What characterizes high-quality interaction in an ECERS assessment?",
            answers: [
              "Teachers directing all activities and conversations",
              "Warm, responsive interactions that support individual children's needs",
              "Maintaining quiet, controlled classroom environments",
              "Focusing primarily on academic instruction"
            ],
            correctAnswer: 1,
            explanation: "High-quality interactions are characterized by warmth, responsiveness, and individualized support that promotes children's development across all domains."
          },
          {
            question: "How should learning materials be organized for optimal ECERS scoring?",
            answers: [
              "Stored high on shelves to prevent mess",
              "Organized in teacher-controlled cabinets",
              "Accessible to children with clear organization and variety",
              "Limited to prevent overstimulation"
            ],
            correctAnswer: 2,
            explanation: "Materials should be easily accessible to children, well-organized, varied, and developmentally appropriate to encourage independent exploration and learning."
          }
        ],
        required: true
      }
    ];
    
    // Update the module with proper structure
    const updateData = {
      title: "Oh boy you have an ECERS assessment coming up",
      content: JSON.stringify({
        sections: properSections,
        moduleType: "deep-dive",
        courseStructure: { modules: [], totalDuration: 55, prerequisites: [] },
        interactiveElements: { hasQuizzes: true, hasSimulations: false, hasDiscussions: false },
        certificationSystem: { enabled: true, passingScore: 80, certificateTemplate: null }
      })
    };
    
    const updateResponse = await fetch(`http://localhost:5000/api/modules/${module.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    
    if (updateResponse.ok) {
      console.log('✅ Module updated successfully with proper title and section structure');
      console.log('New structure:', {
        title: updateData.title,
        sections: properSections.length,
        totalDuration: properSections.reduce((sum, section) => sum + section.duration, 0)
      });
    } else {
      console.log('❌ Failed to update module');
    }
    
  } catch (error) {
    console.error('Error fixing module structure:', error);
  }
}

fixModuleStructure();