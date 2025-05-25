/**
 * Dynamic AI Suggestion Generator
 * This module provides topic-specific content generation for teaching modules
 * with adjustable difficulty levels and contextual adaptation
 */

type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

/**
 * Generate teaching strategies for any module topic
 * Produces high-quality, engaging strategy suggestions
 */
export function generateTeachingStrategies(topic: string, difficulty: DifficultyLevel): string[] {
  const topicLower = topic.toLowerCase();
  
  // Core strategies that work for any teaching topic
  const strategies = [
    `Try the 'preview connection' technique - talk with children about ${topic} privately before group activities. It's like having a teacher superpower for a ${difficulty} classroom!`,
    `Create a special responsibility related to ${topic} for children who need extra engagement. Nothing says 'I see your potential' like being the classroom's official ${topic} helper!`,
    `For teaching ${topic}, use 'first-then' statements: 'First we'll learn about this concept, then you get to try the hands-on activity.' Works like classroom magic!`,
    `Develop a special signal related to ${topic} that helps redirect attention - a gesture that becomes your secret classroom cue when focus drifts.`,
    `The 'two positive comments for every redirection' rule works wonders when teaching ${topic} - catch children being good twice as often as you correct!`
  ];
  
  // Add difficulty-specific strategies
  if (difficulty === 'beginner') {
    strategies.push(
      `For beginners teaching ${topic}, start with just one key concept per week rather than tackling everything at once.`,
      `Find a mentor teacher who has experience with ${topic} - their guidance will be invaluable as you develop your approach.`,
      `Begin with simple vocabulary related to ${topic} and build complexity gradually as children master the basics.`
    );
  } else if (difficulty === 'intermediate') {
    strategies.push(
      `For intermediate ${topic} instruction, create documentation panels that make children's learning visible to families and visitors.`,
      `Develop cross-curricular connections between ${topic} and other areas of your curriculum for deeper learning.`,
      `Try the 'expert groups' approach where small teams of children become specialists in different aspects of ${topic}.`
    );
  } else if (difficulty === 'advanced') {
    strategies.push(
      `For advanced ${topic} teaching, develop action research to measure the effectiveness of your specific approaches.`,
      `Create professional development materials to help colleagues implement effective ${topic} teaching strategies in their own classrooms.`,
      `Design a progressive skill-building framework that maps the development of ${topic} understanding across age groups or developmental stages.`
    );
  }
  
  // Add topic-specific strategies based on common ECE content areas
  if (topicLower.includes('literacy') || topicLower.includes('reading') || topicLower.includes('language')) {
    strategies.push(
      `Create a print-rich environment that connects ${topic} concepts with written language throughout the classroom.`,
      `Use interactive storytelling techniques that engage children emotionally with ${topic} concepts.`,
      `Incorporate ${topic} vocabulary into dramatic play scenarios for meaningful context.`
    );
  } else if (topicLower.includes('math') || topicLower.includes('number') || topicLower.includes('counting')) {
    strategies.push(
      `Use concrete materials first before moving to pictorial and then abstract representations of ${topic} concepts.`,
      `Embed ${topic} language into transitions, routines and everyday activities for natural math exposure.`,
      `Create math games that incorporate physical movement to teach ${topic} - young bodies need to move to learn!`
    );
  } else if (topicLower.includes('science') || topicLower.includes('nature') || topicLower.includes('experiment')) {
    strategies.push(
      `Set up a discovery table with materials that invite exploration of ${topic} through multiple senses.`,
      `Document children's questions about ${topic} and use them to guide further investigation.`,
      `Use the scientific method at an appropriate level: question, predict, try, observe, and discuss ${topic}.`
    );
  } else if (topicLower.includes('social') || topicLower.includes('emotional') || topicLower.includes('feeling')) {
    strategies.push(
      `Use puppets and role-play to explore emotional aspects of ${topic} in a safe, supported context.`,
      `Create a feelings vocabulary connected to ${topic} that helps children name and manage their emotions.`,
      `Incorporate mindfulness practices that help children regulate their bodies and emotions while learning about ${topic}.`
    );
  } else if (topicLower.includes('behavior') || topicLower.includes('challenging') || topicLower.includes('difficult')) {
    strategies.push(
      `For that one spirited child, establish clear visual expectations for ${topic} activities before beginning.`,
      `Give your energetic students special roles during ${topic} lessons to channel their energy positively.`,
      `Create a predictable structure for ${topic} activities that helps children who struggle with transitions.`
    );
  }
  
  return strategies;
}

/**
 * Generate assessment questions for any module topic
 * Produces thoughtful, reflective questions that promote deeper thinking
 */
export function generateAssessmentQuestions(topic: string, difficulty: DifficultyLevel): string[] {
  const topicLower = topic.toLowerCase();
  
  // Core questions that work for any teaching topic
  const questions = [
    `What underlying developmental concepts are most important when teaching ${topic} to young children? (Remember: development follows predictable patterns but at individual paces!)`,
    `How would you differentiate instruction about ${topic} for children with different learning styles and needs?`,
    `What environmental elements might enhance children's understanding of ${topic}, and how would you incorporate them?`,
    `How would you create a progression plan for teaching ${topic} that builds skills over time?`,
    `How might family engagement practices support children's learning about ${topic}?`
  ];
  
  // Add difficulty-specific questions
  if (difficulty === 'beginner') {
    questions.push(
      `What resources would help a new teacher begin exploring ${topic} with young children?`,
      `What simple starting points would you suggest for introducing ${topic} to preschoolers?`,
      `Who could serve as a mentor as you develop your approach to teaching ${topic}?`
    );
  } else if (difficulty === 'intermediate') {
    questions.push(
      `How would you document children's learning about ${topic} to make their progress visible?`,
      `What challenges might arise when implementing activities related to ${topic}, and how would you address them?`,
      `How could you integrate ${topic} across different areas of your curriculum?`
    );
  } else if (difficulty === 'advanced') {
    questions.push(
      `How would you measure the long-term impact of your ${topic} curriculum on children's development?`,
      `What innovative approaches could extend beyond current best practices related to teaching ${topic}?`,
      `How would you mentor colleagues in implementing effective ${topic} teaching practices?`
    );
  }
  
  // Add topic-specific questions based on common ECE content areas
  if (topicLower.includes('literacy') || topicLower.includes('reading') || topicLower.includes('language')) {
    questions.push(
      `How does oral language development connect to your approach to teaching ${topic}?`,
      `What environmental print would you include to support learning about ${topic}?`,
      `How would you support emergent writing related to ${topic}?`
    );
  } else if (topicLower.includes('math') || topicLower.includes('number') || topicLower.includes('counting')) {
    questions.push(
      `How do spatial reasoning skills connect to children's understanding of ${topic}?`,
      `What everyday routines provide natural opportunities for exploring ${topic}?`,
      `How would you help children recognize and create patterns related to ${topic}?`
    );
  } else if (topicLower.includes('science') || topicLower.includes('nature') || topicLower.includes('experiment')) {
    questions.push(
      `How would you support children's natural curiosity about ${topic}?`,
      `What scientific process skills would you emphasize when teaching ${topic} to preschoolers?`,
      `How would you create meaningful opportunities for scientific observation related to ${topic}?`
    );
  } else if (topicLower.includes('social') || topicLower.includes('emotional') || topicLower.includes('feeling')) {
    questions.push(
      `How would you help children develop emotional vocabulary related to ${topic}?`,
      `What strategies support children in developing friendship skills while learning about ${topic}?`,
      `How would you create a classroom community that values diversity of perspectives about ${topic}?`
    );
  } else if (topicLower.includes('behavior') || topicLower.includes('challenging') || topicLower.includes('difficult')) {
    questions.push(
      `What underlying needs might be driving challenging behavior during ${topic} activities?`,
      `What environmental modifications might prevent challenging behaviors related to ${topic}?`,
      `How might trauma-informed practices help you connect with students who struggle with ${topic}?`
    );
  }
  
  return questions;
}

/**
 * Generate quiz questions for any module topic
 * Produces engaging multiple-choice questions with appropriate distractors
 */
export function generateQuizQuestions(topic: string, difficulty: DifficultyLevel): any[] {
  const topicLower = topic.toLowerCase();
  
  // Core quiz questions that work for any teaching topic
  const quizQuestions = [
    {
      question: `Which approach is most developmentally appropriate when teaching young children about ${topic}?`,
      options: [
        "Using primarily worksheets and flashcards",
        "Incorporating play-based activities with intentional teaching moments",
        "Having children memorize key facts",
        "Using lecture-style instruction"
      ],
      correctAnswer: "Incorporating play-based activities with intentional teaching moments"
    },
    {
      question: `When planning activities related to ${topic}, which of the following is most important?`,
      options: [
        "Ensuring all children complete the same activities in the same way",
        "Focusing primarily on academic skills",
        "Considering children's interests and developmental levels",
        "Following a prescribed curriculum exactly"
      ],
      correctAnswer: "Considering children's interests and developmental levels"
    },
    {
      question: `How can teachers best support family engagement related to ${topic}?`,
      options: [
        "Sending home worksheets for parents to complete with children",
        "Sharing information only when problems arise",
        "Providing regular communication about classroom learning and simple extension activities",
        "Expecting families to teach the same content at home"
      ],
      correctAnswer: "Providing regular communication about classroom learning and simple extension activities"
    }
  ];
  
  // Add difficulty-specific quiz questions
  if (difficulty === 'beginner') {
    quizQuestions.push({
      question: `For a teacher new to teaching ${topic}, which resource would be most helpful?`,
      options: [
        "A detailed curriculum guide with scripted lessons",
        "Observation of experienced teachers and collaborative planning",
        "Advanced research articles on the theoretical foundations",
        "Focus solely on trial and error in their own classroom"
      ],
      correctAnswer: "Observation of experienced teachers and collaborative planning"
    });
  } else if (difficulty === 'intermediate') {
    quizQuestions.push({
      question: `Which assessment approach would be most appropriate for understanding children's learning about ${topic}?`,
      options: [
        "Weekly quizzes on key concepts",
        "Standardized tests at the end of each unit",
        "Documentation through photos, notes, and work samples over time",
        "Comparing children to each other using checklists"
      ],
      correctAnswer: "Documentation through photos, notes, and work samples over time"
    });
  } else if (difficulty === 'advanced') {
    quizQuestions.push({
      question: `Which approach demonstrates advanced teaching practice related to ${topic}?`,
      options: [
        "Creating a comprehensive written curriculum that others follow exactly",
        "Developing an emergent curriculum that follows children's interests while addressing key concepts",
        "Teaching ${topic} in isolation from other subject areas",
        "Focusing exclusively on academic skills related to ${topic}"
      ],
      correctAnswer: "Developing an emergent curriculum that follows children's interests while addressing key concepts"
    });
  }
  
  // Add topic-specific quiz questions based on common ECE content areas
  if (topicLower.includes('literacy') || topicLower.includes('reading') || topicLower.includes('language')) {
    quizQuestions.push({
      question: "Which practice best supports early literacy development?",
      options: [
        "Daily handwriting worksheets",
        "Memorizing the alphabet song",
        "Interactive read-alouds with open-ended questions",
        "Flash card drills of sight words"
      ],
      correctAnswer: "Interactive read-alouds with open-ended questions"
    });
  } else if (topicLower.includes('math') || topicLower.includes('number') || topicLower.includes('counting')) {
    quizQuestions.push({
      question: "Which approach best supports mathematical thinking in young children?",
      options: [
        "Teaching computation skills through worksheets",
        "Providing daily calendar time",
        "Offering varied materials for counting, sorting, and pattern-making",
        "Teaching one math concept per week in isolation"
      ],
      correctAnswer: "Offering varied materials for counting, sorting, and pattern-making"
    });
  } else if (topicLower.includes('science') || topicLower.includes('nature') || topicLower.includes('experiment')) {
    quizQuestions.push({
      question: "Which best describes effective science education for young children?",
      options: [
        "Memorizing scientific facts",
        "Watching teacher demonstrations",
        "Hands-on exploration with teacher guidance",
        "Reading about scientific concepts"
      ],
      correctAnswer: "Hands-on exploration with teacher guidance"
    });
  } else if (topicLower.includes('social') || topicLower.includes('emotional') || topicLower.includes('feeling')) {
    quizQuestions.push({
      question: "Which approach best supports emotional regulation in preschoolers?",
      options: [
        "Removing children from the group when they show strong emotions",
        "Teaching emotional vocabulary and coping strategies",
        "Distracting children when they are upset",
        "Telling children not to cry or show negative emotions"
      ],
      correctAnswer: "Teaching emotional vocabulary and coping strategies"
    });
  } else if (topicLower.includes('behavior') || topicLower.includes('challenging') || topicLower.includes('difficult')) {
    quizQuestions.push({
      question: "What is the most effective approach to addressing challenging behaviors?",
      options: [
        "Implementing time-out for any disruptive behavior",
        "Identifying the function of the behavior and teaching alternative skills",
        "Using a reward system with stickers or prizes",
        "Removing privileges when children misbehave"
      ],
      correctAnswer: "Identifying the function of the behavior and teaching alternative skills"
    });
  }
  
  return quizQuestions;
}