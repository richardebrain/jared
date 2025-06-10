/**
 * Debug script to check module saving and title preservation
 */

const testModuleData = {
  title: "Oh boy you have an ECERS assessment coming up",
  description: "A comprehensive deep dive workshop to prepare educators for ECERS assessment success",
  category: "assessment-preparation",
  difficulty: "advanced",
  estimatedTime: "45",
  customPoints: "150",
  moduleType: "deep-dive",
  sections: [
    {
      type: "text",
      title: "Introduction to ECERS",
      content: "Understanding the Environment Rating Scale and its importance in early childhood education...",
      duration: 10
    },
    {
      type: "quiz", 
      title: "ECERS Knowledge Check",
      questions: [
        {
          question: "What does ECERS stand for?",
          answers: ["Early Childhood Environment Rating Scale", "Educational Child Environment Review System", "Early Care Environment Rating Scale", "Educational Childhood Environment Rating Scale"],
          correctAnswer: 0,
          explanation: "ECERS stands for Early Childhood Environment Rating Scale"
        }
      ],
      duration: 15
    }
  ]
};

async function testModuleSave() {
  try {
    console.log('Testing module save with data:', JSON.stringify(testModuleData, null, 2));
    
    const response = await fetch('/api/modules/publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        module: testModuleData,
        type: 'library',
        includeInLibrary: true,
        allowComments: true
      })
    });
    
    const result = await response.json();
    console.log('Save result:', result);
    
    // Check if the module was saved with correct title
    const savedModule = await fetch(`/api/modules/${result.moduleId}`);
    const moduleData = await savedModule.json();
    console.log('Retrieved module:', moduleData);
    
    if (moduleData.title === testModuleData.title) {
      console.log('✅ Title preserved correctly');
    } else {
      console.log('❌ Title not preserved. Expected:', testModuleData.title, 'Got:', moduleData.title);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testModuleSave();