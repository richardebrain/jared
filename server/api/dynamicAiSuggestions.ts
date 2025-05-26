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
  let strategies: string[] = [];
  
  // Specific strategies based on topic recognition
  if (topicLower.includes('that one kid') || topicLower.includes('challenging behavior') || topicLower.includes('difficult child')) {
    strategies = [
      `Build a strong relationship first - spend 5 minutes of one-on-one time with this child daily. Think of yourself as their personal cheerleader and life coach rolled into one! 📣`,
      `Create a 'calm down kit' specific to their needs - stress ball, fidget toy, or special picture. It's like Batman's utility belt, but for emotions! 🦸‍♂️`,
      `Use positive behavior narration: "I see you walking carefully around your friends" rather than "Don't run." Be their personal sports commentator, but only for the good plays!`,
      `Visual schedules are your secret weapon - when kids know what's coming next, they're less likely to turn into tiny tornadoes of chaos! 🌪️`,
      `Give choices whenever possible: "Clean up blocks or art supplies first?" Choice = power, and powerful kids make better decisions (and fewer meltdowns!).`,
      `Create a special helper role - being the "Chief Line Leader" or "Snack Distribution Expert" can work miracles. Who doesn't want an important job title? 👨‍💼`,
      `Use the "teacher proximity magic" - sometimes just being nearby is like having a superhero cape that prevents chaos!`,
      `Develop secret signals - a thumbs up or nose touch becomes their "help me" button. It's like having a classroom walkie-talkie system! 📻`
    ];
  } else if (topicLower.includes('literacy') || topicLower.includes('reading') || topicLower.includes('language') || topicLower.includes('writing')) {
    strategies = [
      `Create a print-rich environment where children see their names, favorite words, and meaningful text everywhere - from labels to story charts.`,
      `Use interactive read-alouds with props, voices, and movement - make stories come alive so children connect emotionally with books.`,
      `Implement morning message writing where children help you write about the day ahead - they see writing has real purpose and meaning.`,
      `Set up a classroom library with cozy reading nooks using pillows, soft lighting, and book baskets organized by theme or reading level.`,
      `Use story retelling with felt boards, puppets, or dramatic play - children internalize story structure through hands-on experiences.`,
      `Create individual name recognition activities - children love seeing their names in different fonts, colors, and contexts around the room.`,
      `Implement letter sound games during transitions - "Everyone whose name starts with /b/ can line up" makes phonics fun and practical.`,
      `Use environmental print collections - bring in cereal boxes, street signs, and logos children recognize to bridge home and school literacy.`
    ];
  } else if (topicLower.includes('math') || topicLower.includes('number') || topicLower.includes('counting') || topicLower.includes('shapes')) {
    strategies = [
      `Forget worksheets! Use blocks, counters, and manipulatives - kids need to touch math to understand it. Think "hands-on mathematician" not "tiny accountant!" 🧮`,
      `Sneak math into everything: "3 more minutes until cleanup!" "Let's count friends!" "How many crackers?" Math is everywhere when you have teacher vision! 👀`,
      `Create a "math laboratory" with rulers, scales, and measuring cups - suddenly everyone's a scientist AND a mathematician! 🔬`,
      `Number songs are your secret weapon - when kids sing "5 Little Ducks," they're doing advanced subtraction and don't even know it! 🎵`,
      `Turn everything into a comparison game: "Whose tower is taller?" "Who has more goldfish crackers?" Competition makes math irresistible! 🏆`,
      `Pattern parties with real objects - buttons, shells, blocks - way more fun than worksheet patterns (and no pencil grip required!). 🌟`,
      `Your classroom is a math wonderland: count bathroom steps, sort snacks by color, measure cooking ingredients. Math. Is. Everywhere! 🏠`,
      `Personal math stories hit different: "Emma has 3 toy dinosaurs, then finds 2 more. How many dinos are having a party?" 🦕`
    ];
  } else if (topicLower.includes('science') || topicLower.includes('nature') || topicLower.includes('experiment') || topicLower.includes('discovery')) {
    strategies = [
      `Set up an investigation table with magnifying glasses, scales, and natural materials that invite open-ended exploration.`,
      `Document children's questions on chart paper and use them to guide your science investigations - follow their curiosity.`,
      `Use the "predict, try, observe" method: "What do you think will happen? Let's try it and see. What did you notice?"`,
      `Take science learning outdoors whenever possible - nature is the ultimate science laboratory for young children.`,
      `Create science journals using drawings and children's dictated words to document discoveries and observations over time.`,
      `Use everyday materials for experiments - baking soda, vinegar, food coloring - to show science happens everywhere.`,
      `Invite children to be "nature detectives" looking for patterns, changes, and interesting phenomena in their environment.`,
      `Connect science to children's bodies: "How does your heart feel after running? What happens to your breath when you exercise?"`
    ];
  } else if (topicLower.includes('art') || topicLower.includes('creative') || topicLower.includes('drawing') || topicLower.includes('paint')) {
    strategies = [
      `Provide open-ended art materials that allow for process-focused rather than product-focused creation - focus on exploration, not perfection.`,
      `Set up art provocations that invite investigation: "What happens when you paint with ice cubes?" or "How many ways can you use this paintbrush?"`,
      `Display children's artwork at their eye level with their own words about their creative process documented alongside.`,
      `Offer diverse art materials from different cultures and traditions to expand children's understanding of artistic expression.`,
      `Create collaborative art projects where children work together on large-scale pieces, developing social skills alongside creativity.`,
      `Use art as a language for children who may not yet have extensive verbal skills - let them express ideas through color, line, and form.`,
      `Connect art to other curriculum areas: paint with nature materials (science), create patterns (math), illustrate stories (literacy).`,
      `Save interesting "mistakes" and "accidents" in art - they often lead to the most innovative discoveries and creative breakthroughs.`
    ];
  } else if (topicLower.includes('music') || topicLower.includes('rhythm') || topicLower.includes('song') || topicLower.includes('movement')) {
    strategies = [
      `Use music and movement for transitions - create special songs for cleanup time, lining up, or getting ready for lunch.`,
      `Provide simple instruments that children can explore independently - shakers, drums, bells - in a dedicated music area.`,
      `Connect music to children's cultures by inviting families to share songs and musical traditions from their heritage.`,
      `Create rhythm patterns with body percussion (clapping, stomping, snapping) before introducing instruments.`,
      `Use call and response songs to develop listening skills and create a sense of community in your classroom.`,
      `Make your own instruments using recycled materials - toilet paper roll shakers, oatmeal container drums, rubber band guitars.`,
      `Use music to support emotional regulation - calming songs for rest time, energetic songs for active play.`,
      `Document children's original songs and musical creations - their natural musical expression is valuable and worth preserving.`
    ];
  } else if (topicLower.includes('outdoor') || topicLower.includes('nature') || topicLower.includes('garden') || topicLower.includes('playground')) {
    strategies = [
      `Take learning outside daily - fresh air and natural materials provide endless opportunities for discovery and wonder.`,
      `Create outdoor learning stations: mud kitchen, water wall, digging area, and building space with natural materials.`,
      `Use nature as your curriculum - observe seasonal changes, collect natural treasures, and document what children discover.`,
      `Implement "loose parts" play with sticks, stones, shells, and pinecones that children can move and manipulate freely.`,
      `Encourage risk-appropriate challenge: climbing, balancing, jumping - children need to test their physical capabilities.`,
      `Create quiet outdoor spaces too - reading nooks under trees, meditation circles, and observation spots for introverted children.`,
      `Document outdoor learning through nature journals, photography, and children's verbal reflections about their discoveries.`,
      `Connect outdoor experiences to indoor follow-up: paint with mud, create nature collages, write stories about outdoor adventures.`
    ];
  } else if (topicLower.includes('social') || topicLower.includes('emotional') || topicLower.includes('feeling') || topicLower.includes('friendship')) {
    strategies = [
      `Use emotion coaching: "I see you're feeling frustrated. Your face looks angry and your fists are tight. What can we do to help?"`,
      `Create an emotion vocabulary wall with photos of children showing different feelings - make emotions concrete and visible.`,
      `Read books about feelings daily and connect stories to children's real experiences: "Remember when you felt worried like the character?"`,
      `Implement problem-solving steps children can use: "What's the problem? What are some solutions? Let's try one and see what happens."`,
      `Use calm-down strategies that work for different children: deep breathing, counting, squeezing a stress ball, or looking at family photos.`,
      `Narrate positive social interactions: "I saw you share your toy with Marcus. That showed kindness and made him smile."`,
      `Create friendship activities: partner projects, buddy systems, and opportunities for children to help and care for each other.`,
      `Model emotional regulation yourself - children learn more from what they see than what they hear about managing feelings.`
    ];
  } else if (topicLower.includes('dramatic play') || topicLower.includes('pretend') || topicLower.includes('imaginative') || topicLower.includes('dress up')) {
    strategies = [
      `Change dramatic play themes based on children's interests - if they're fascinated by construction, create a building site center.`,
      `Provide real props when possible: actual kitchen tools, real telephones, authentic cultural clothing and artifacts.`,
      `Extend dramatic play by adding literacy: clipboards for taking orders, signs for the play store, prescription pads for the doctor's office.`,
      `Take photos of children's elaborate play scenarios and display them to show how much you value their creative thinking.`,
      `Add diversity to dramatic play through dolls, books, and props that represent many different families and cultures.`,
      `Create outdoor dramatic play opportunities: camping with real tents, car wash with hoses, outdoor kitchen with mud and water.`,
      `Support shy children by providing behind-the-scenes roles: ticket seller, cook in the restaurant kitchen, veterinarian assistant.`,
      `Connect dramatic play to curriculum goals: pharmacy for math (counting pills), veterinarian office for science (animal care).`
    ];
  } else if (topicLower.includes('family') || topicLower.includes('parent') || topicLower.includes('home') || topicLower.includes('culture')) {
    strategies = [
      `Create family photo displays at children's eye level and refer to them throughout the day: "Your grandma would love to see this artwork!"`,
      `Invite family members to share their expertise: a parent who's a firefighter, a grandparent who speaks another language.`,
      `Honor different family structures through books, dolls, and discussions that validate all types of families children know.`,
      `Send home documentation of learning with specific questions: "Ask your child about our science experiment with floating and sinking."`,
      `Create family recipe books, tradition sharing projects, and cultural celebration opportunities throughout the year.`,
      `Use home visits or virtual meetings to see children in their family context and understand their home experiences.`,
      `Provide materials in families' home languages and invite bilingual family members to read stories to the class.`,
      `Respect different parenting approaches while maintaining consistent classroom expectations and clear communication about school practices.`
    ];
  } else if (topicLower.includes('transition') || topicLower.includes('routine') || topicLower.includes('schedule') || topicLower.includes('cleanup')) {
    strategies = [
      `Create visual schedules with photos of actual children in your class doing each routine - this makes expectations concrete and personal.`,
      `Use transition songs that children help create: "This is the way we clean our room" with movements children suggest.`,
      `Give 5-minute and 2-minute warnings before transitions, using visual timers so children can see time passing.`,
      `Create special jobs during transitions: line leader, light switcher, door holder - everyone can have an important role.`,
      `Use dramatic play to practice routines: "pretend it's cleanup time" during play lets children rehearse expectations.`,
      `Make cleanup engaging with sorting games: "Find all the red toys" or "Put away everything that starts with B."`,
      `Celebrate successful transitions: "Everyone listened for the cleanup song and found something to put away. Teamwork!"`,
      `Plan engaging activities immediately following difficult transitions to motivate children through the challenging parts.`
    ];
  } else if (topicLower.includes('block') || topicLower.includes('building') || topicLower.includes('construction') || topicLower.includes('engineering')) {
    strategies = [
      `Provide blocks of different sizes, materials, and textures: wooden unit blocks, foam blocks, cardboard blocks, natural wood pieces.`,
      `Add people figures, animals, and vehicles that reflect the diversity of your community and children's families.`,
      `Document block constructions through photos before cleanup time, creating a "block builders gallery" to honor children's work.`,
      `Introduce engineering vocabulary naturally: "Your bridge is sturdy" or "That foundation looks stable."`,
      `Connect block play to math: counting, sorting by size, creating patterns, measuring with non-standard units.`,
      `Add literacy to block play: signs for buildings, maps of the block city, books about construction and architecture.`,
      `Encourage collaboration: "Can you work together to build something bigger than either of you could make alone?"`,
      `Create block building challenges: "Can you build a tower as tall as your shoulder?" or "Make a bridge a car can drive under."`
    ];
  } else {
    // Enhanced default strategies for any topic
    strategies = [
      `Connect this topic to children's real experiences and interests - authentic learning happens when kids see relevance to their lives.`,
      `Use multi-sensory approaches: let children see, hear, touch, move, and when appropriate, taste and smell to explore this topic fully.`,
      `Create hands-on investigations where children can experiment, test ideas, and make discoveries about this topic through active exploration.`,
      `Implement project-based learning where children can dive deep into aspects of this topic that fascinate them most.`,
      `Use open-ended questioning to extend thinking: "What do you notice?" "Why do you think that happened?" "What would happen if...?"`,
      `Document children's learning journey through photos, quotes, and work samples that show how their understanding develops over time.`,
      `Connect this topic across all curriculum areas - art, music, math, science, literacy, and social-emotional learning.`,
      `Invite community experts to share their knowledge and passion for this topic, bringing real-world connections into your classroom.`
    ];
  }
  
  // Add difficulty-specific strategies with humor
  if (difficulty === 'beginner') {
    strategies.push(
      `New to teaching this topic? Start with one key concept per week - think of it as the appetizer before the main course! 🍽️`,
      `Find a mentor teacher who's mastered this topic - they're like your teaching GPS, preventing those "how did I end up here?" moments!`,
      `Begin with simple vocabulary and build complexity gradually - like teaching children to walk before they run (or in preschool terms, before they zoom around like tiny tornadoes!).`
    );
  } else if (difficulty === 'intermediate') {
    strategies.push(
      `Ready for the next level? Create documentation panels that show families your teaching superpowers in action!`,
      `Connect this topic to everything else - you're basically becoming a curriculum DJ, mixing all the best learning beats together! 🎵`,
      `Try 'expert groups' where children become mini-professors of different aspects - they take this job VERY seriously (and it's adorable).`
    );
  } else if (difficulty === 'advanced') {
    strategies.push(
      `You're in the teaching major leagues now! Develop action research to prove what you already know - that you're making magic happen daily! ✨`,
      `Share your wisdom with colleagues - become the teaching guru others seek for professional development (cape optional but recommended).`,
      `Design frameworks that map learning across age groups - you're basically creating the blueprint for future amazing teachers!`
    );
  }
  
  // Add topic-specific strategies based on common ECE content areas
  if (topicLower.includes('literacy') || topicLower.includes('reading') || topicLower.includes('language')) {
    strategies.push(
      `Create a print-rich environment that connects ${topic} concepts with written language throughout the classroom.`,
      `Use interactive storytelling techniques that engage children emotionally with ${topic} concepts.`,
      `Incorporate ${topic} vocabulary into dramatic play scenarios for meaningful context.`,
      `Design a book nook featuring diverse literature that relates to ${topic}, encouraging children to explore independently.`,
      `Create a "word wall" dedicated to ${topic} that grows throughout your teaching unit as children learn new vocabulary.`
    );
  } else if (topicLower.includes('math') || topicLower.includes('number') || topicLower.includes('counting')) {
    strategies.push(
      `Use concrete materials first before moving to pictorial and then abstract representations of ${topic} concepts.`,
      `Embed ${topic} language into transitions, routines and everyday activities for natural math exposure.`,
      `Create math games that incorporate physical movement to teach ${topic} - young bodies need to move to learn!`,
      `Develop a math vocabulary chart specific to ${topic} with visual representations of key concepts.`,
      `Set up measurement and comparison activities where children can directly experience ${topic} in hands-on ways.`
    );
  } else if (topicLower.includes('science') || topicLower.includes('nature') || topicLower.includes('experiment')) {
    strategies.push(
      `Set up a discovery table with materials that invite exploration of ${topic} through multiple senses.`,
      `Document children's questions about ${topic} and use them to guide further investigation.`,
      `Use the scientific method at an appropriate level: question, predict, try, observe, and discuss ${topic}.`,
      `Create a class documentation board where you record children's observations and discoveries about ${topic}.`,
      `Take learning outdoors when possible to connect ${topic} with the natural environment children can observe firsthand.`
    );
  } else if (topicLower.includes('social') || topicLower.includes('emotional') || topicLower.includes('feeling')) {
    strategies.push(
      `Use puppets and role-play to explore emotional aspects of ${topic} in a safe, supported context.`,
      `Create a feelings vocabulary connected to ${topic} that helps children name and manage their emotions.`,
      `Incorporate mindfulness practices that help children regulate their bodies and emotions while learning about ${topic}.`,
      `Design a "peace corner" with tools and visuals related to ${topic} where children can practice self-regulation.`,
      `Use social stories that address common challenges related to ${topic} in ways children can understand and relate to.`
    );
  } else if (topicLower.includes('behavior') || topicLower.includes('challenging') || topicLower.includes('difficult')) {
    strategies.push(
      `For that one spirited child, establish clear visual expectations for ${topic} activities before beginning.`,
      `Give your energetic students special roles during ${topic} lessons to channel their energy positively.`,
      `Create a predictable structure for ${topic} activities that helps children who struggle with transitions.`,
      `Develop an individualized visual support system for children who need extra help with ${topic}.`,
      `Use positive behavior reinforcement specifically focused on successful engagement with ${topic} activities.`
    );
  } else if (topicLower.includes('art') || topicLower.includes('creative') || topicLower.includes('craft')) {
    strategies.push(
      `Provide open-ended art materials that allow children to explore ${topic} through multiple media and techniques.`,
      `Create an inspiration gallery with diverse examples related to ${topic} to spark creativity without dictating outcomes.`,
      `Document children's creative process with ${topic}, not just their final products.`,
      `Integrate ${topic} into other areas of the curriculum to show how art connects to math, science, and literacy.`,
      `Use the language of art (color, shape, texture, design) when discussing children's exploration of ${topic}.`
    );
  } else if (topicLower.includes('music') || topicLower.includes('rhythm') || topicLower.includes('song')) {
    strategies.push(
      `Create a listening station where children can explore various aspects of ${topic} at their own pace.`,
      `Use call-and-response techniques to engage children actively in ${topic} learning experiences.`,
      `Incorporate movement and dance to help kinesthetic learners connect with concepts in ${topic}.`,
      `Create visual representations of sounds and patterns related to ${topic} to connect auditory and visual learning.`,
      `Design simple instruments that children can use to explore and create with ${topic} concepts.`
    );
  } else if (topicLower.includes('outdoor') || topicLower.includes('nature') || topicLower.includes('environment')) {
    strategies.push(
      `Create an outdoor classroom area specifically designed for exploring ${topic} in the natural environment.`,
      `Use natural materials for sorting, classifying, and creating patterns related to ${topic}.`,
      `Develop a documentation system for recording children's observations about ${topic} in the outdoor environment.`,
      `Bring outdoor elements inside to extend learning about ${topic} during inclement weather.`,
      `Create connections between ${topic} and sustainable practices appropriate for young children.`
    );
  } else if (topicLower.includes('motor') || topicLower.includes('movement') || topicLower.includes('physical')) {
    strategies.push(
      `Design movement challenges that specifically develop skills related to ${topic} at different levels of difficulty.`,
      `Create visual supports showing the steps or components of physical skills involved in ${topic}.`,
      `Incorporate fine motor activities into learning centers that connect with ${topic} concepts.`,
      `Use adaptive equipment as needed to ensure all children can participate successfully in ${topic} activities.`,
      `Break down complex movement skills in ${topic} into smaller components for scaffolded learning.`
    );
  } else if (topicLower.includes('family') || topicLower.includes('home') || topicLower.includes('parent')) {
    strategies.push(
      `Create simple take-home activities that extend classroom learning about ${topic} in meaningful ways.`,
      `Develop a family resource library with materials related to ${topic} that families can borrow.`,
      `Use digital communication tools to share documentation of children's learning about ${topic} with families.`,
      `Invite family members to share their knowledge and expertise related to ${topic} in the classroom.`,
      `Create opportunities for two-way communication about children's interests and questions related to ${topic}.`
    );
  } else if (topicLower.includes('transition') || topicLower.includes('routine') || topicLower.includes('schedule')) {
    strategies.push(
      `Create visual schedules that help children understand and anticipate the sequence of ${topic} activities.`,
      `Use transition songs or chants specific to ${topic} that signal changes in the daily routine.`,
      `Provide individual visual supports for children who need extra help with ${topic} transitions.`,
      `Create consistent rituals around ${topic} that provide security and predictability.`,
      `Allow extra time for transitions related to ${topic}, especially for children who struggle with change.`
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
  let quizQuestions: any[] = [];
  
  // Topic-specific quiz questions based on content area
  if (topicLower.includes('that one kid') || topicLower.includes('challenging behavior') || topicLower.includes('difficult child')) {
    quizQuestions = [
      {
        question: "When working with a child who displays challenging behaviors, what should be your first priority?",
        options: [
          "Implementing immediate consequences for misbehavior",
          "Building a positive relationship and understanding the child's needs",
          "Removing the child from group activities",
          "Focusing on academic instruction to keep them busy"
        ],
        correctAnswer: "Building a positive relationship and understanding the child's needs"
      },
      {
        question: "Which strategy is most effective for preventing challenging behaviors?",
        options: [
          "Waiting for problems to occur, then addressing them",
          "Using consistent consequences regardless of the situation",
          "Creating predictable routines and clear expectations",
          "Isolating the child when they struggle"
        ],
        correctAnswer: "Creating predictable routines and clear expectations"
      },
      {
        question: "How should you respond when a child is having a meltdown or emotional outburst?",
        options: [
          "Tell them to stop crying and use their words",
          "Put them in time-out until they calm down",
          "Stay calm, ensure safety, and offer comfort when they're ready",
          "Ignore the behavior completely"
        ],
        correctAnswer: "Stay calm, ensure safety, and offer comfort when they're ready"
      },
      {
        question: "What's the best way to help a child develop self-regulation skills?",
        options: [
          "Expect them to control themselves without support",
          "Teach coping strategies and practice them during calm moments",
          "Remove all triggers from their environment",
          "Only intervene when behaviors become disruptive"
        ],
        correctAnswer: "Teach coping strategies and practice them during calm moments"
      }
    ];
  } else if (topicLower.includes('literacy') || topicLower.includes('reading') || topicLower.includes('language')) {
    quizQuestions = [
      {
        question: "Which approach best supports emergent literacy in preschoolers?",
        options: [
          "Direct phonics instruction with worksheets",
          "Memorizing sight words through flashcards",
          "Rich language experiences through stories, songs, and conversations",
          "Formal reading lessons with grade-level texts"
        ],
        correctAnswer: "Rich language experiences through stories, songs, and conversations"
      },
      {
        question: "How can you best support a child who speaks a language other than English at home?",
        options: [
          "Discourage use of their home language in the classroom",
          "Focus only on English vocabulary and grammar",
          "Value their home language while supporting English development",
          "Separate them from English-speaking peers during literacy activities"
        ],
        correctAnswer: "Value their home language while supporting English development"
      },
      {
        question: "What's the most important element of a print-rich classroom environment?",
        options: [
          "Walls covered with teacher-made bulletin boards",
          "Meaningful print that connects to children's interests and experiences",
          "Alphabet posters displayed at adult eye level",
          "Commercially produced reading charts and displays"
        ],
        correctAnswer: "Meaningful print that connects to children's interests and experiences"
      }
    ];
  } else if (topicLower.includes('math') || topicLower.includes('number') || topicLower.includes('counting')) {
    quizQuestions = [
      {
        question: "What's the most effective way to introduce number concepts to preschoolers?",
        options: [
          "Using worksheets with number practice",
          "Memorizing number facts through repetition",
          "Hands-on exploration with concrete materials",
          "Flash cards for number recognition"
        ],
        correctAnswer: "Hands-on exploration with concrete materials"
      },
      {
        question: "Which activity best develops mathematical thinking in young children?",
        options: [
          "Completing number puzzles independently",
          "Comparing, sorting, and organizing real objects",
          "Practicing number writing on paper",
          "Reciting number sequences from memory"
        ],
        correctAnswer: "Comparing, sorting, and organizing real objects"
      },
      {
        question: "How should mathematical learning be integrated into the preschool day?",
        options: [
          "During a separate 30-minute math lesson only",
          "Embedded naturally in routines, play, and exploration",
          "As homework assignments for families",
          "Through computer-based math programs"
        ],
        correctAnswer: "Embedded naturally in routines, play, and exploration"
      }
    ];
  } else if (topicLower.includes('science') || topicLower.includes('nature') || topicLower.includes('experiment')) {
    quizQuestions = [
      {
        question: "What's the best way to introduce scientific thinking to preschoolers?",
        options: [
          "Teaching them to memorize scientific facts",
          "Encouraging questions and hands-on exploration",
          "Using complicated scientific vocabulary",
          "Showing them educational videos only"
        ],
        correctAnswer: "Encouraging questions and hands-on exploration"
      },
      {
        question: "Which statement about preschool science experiments is most accurate?",
        options: [
          "Results don't matter - it's all about the process and wonder!",
          "Children should get the 'right' answer every time",
          "Only do experiments with guaranteed outcomes",
          "Focus on teaching complex scientific theories"
        ],
        correctAnswer: "Results don't matter - it's all about the process and wonder!"
      }
    ];
  } else if (topicLower.includes('art') || topicLower.includes('creative') || topicLower.includes('music')) {
    quizQuestions = [
      {
        question: "What's the most important goal of creative activities with young children?",
        options: [
          "Creating beautiful products to display",
          "Teaching specific artistic techniques",
          "Encouraging self-expression and creativity",
          "Making sure all artwork looks the same"
        ],
        correctAnswer: "Encouraging self-expression and creativity"
      },
      {
        question: "How should you respond when a child says their artwork 'doesn't look right'?",
        options: [
          "Fix it for them so it looks better",
          "Tell them it's wrong and show them the correct way",
          "Ask them to tell you about their creation and what they were thinking",
          "Ignore their concern and move on"
        ],
        correctAnswer: "Ask them to tell you about their creation and what they were thinking"
      }
    ];
  } else if (topicLower.includes('outdoor') || topicLower.includes('nature') || topicLower.includes('playground')) {
    quizQuestions = [
      {
        question: "What's the teacher's most important role during outdoor play?",
        options: [
          "Directing all activities and keeping children in one area",
          "Staying inside while children play independently",
          "Observing, facilitating, and ensuring safety while encouraging exploration",
          "Making sure children stay clean and don't get dirty"
        ],
        correctAnswer: "Observing, facilitating, and ensuring safety while encouraging exploration"
      },
      {
        question: "How should teachers handle 'risky play' like climbing or jumping?",
        options: [
          "Ban all potentially risky activities",
          "Allow any activity children want to try",
          "Support age-appropriate risk-taking with proper supervision",
          "Only allow risk-taking for older children"
        ],
        correctAnswer: "Support age-appropriate risk-taking with proper supervision"
      }
    ];
  } else {
    // Enhanced default questions for any topic with humor
    quizQuestions = [
      {
        question: `Which approach works best when teaching young children? (Hint: Think like a preschooler! 🎈)`,
        options: [
          "Worksheets and flashcards (because tiny fingers LOVE holding pencils for hours... not!)",
          "Play-based activities with intentional teaching moments (aka 'sneaky learning'!)",
          "Having children memorize facts (like tiny parrots, but less colorful)",
          "Lecture-style instruction (because 4-year-olds are famous for their attention spans 😄)"
        ],
        correctAnswer: "Play-based activities with intentional teaching moments (aka 'sneaky learning'!)"
      },
      {
        question: `When planning activities, what should be your North Star? ⭐`,
        options: [
          "Making sure everyone does exactly the same thing (cookie-cutter kids, anyone?)",
          "Focusing only on academic skills (fun is for recess, right?)",
          "Considering children's interests and developmental levels (the magical sweet spot!)",
          "Following curriculum guides word-for-word (because flexibility is overrated... NOT!)"
        ],
        correctAnswer: "Considering children's interests and developmental levels (the magical sweet spot!)"
      },
      {
        question: `How can teachers build amazing family partnerships? 🤝`,
        options: [
          "Sending home worksheets (because parents LOVE more homework!)",
          "Only communicating when problems arise (surprise phone calls!)",
          "Regular communication about learning + simple extension activities (the winning combo!)",
          "Expecting families to replicate school at home (because that's totally realistic!)"
        ],
        correctAnswer: "Regular communication about learning + simple extension activities (the winning combo!)"
      },
      {
        question: `What's the secret ingredient to engaging young learners? 🎭`,
        options: [
          "Keeping activities serious and academic at all times",
          "Following a strict schedule with no flexibility",
          "Making learning joyful, hands-on, and meaningful to their lives",
          "Using the same teaching method for every child"
        ],
        correctAnswer: "Making learning joyful, hands-on, and meaningful to their lives"
      }
    ];
  }
  
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