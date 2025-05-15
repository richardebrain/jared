-- Add knowledge quiz game on classroom management
INSERT INTO educational_games (
  title, 
  description, 
  type, 
  difficulty, 
  category, 
  points_value, 
  config
)
VALUES (
  'Classroom Management Quiz', 
  'Test your knowledge of effective classroom management techniques in an early childhood setting.',
  'knowledge-quiz',
  'medium',
  'classroom-management',
  15,
  '{
    "passingScore": 70,
    "questions": [
      {
        "id": 1,
        "question": "What is the most effective first step when a child is having a tantrum in class?",
        "options": [
          "Immediately remove the child from the classroom",
          "Remain calm and ensure safety of all children",
          "Firmly tell the child to stop the behavior",
          "Give the child what they want to stop the behavior"
        ],
        "correctAnswer": 1,
        "explanation": "The first priority is to remain calm yourself and ensure the safety of all children. Your calm response models emotional regulation."
      },
      {
        "id": 2,
        "question": "What is the purpose of establishing classroom rules?",
        "options": [
          "To have a way to punish children who misbehave",
          "To create a structured environment that prevents chaos",
          "To demonstrate teacher authority",
          "To restrict children''s natural development"
        ],
        "correctAnswer": 1,
        "explanation": "Classroom rules create structure and predictability, helping children feel secure and understand expectations."
      },
      {
        "id": 3,
        "question": "What is the recommended approach for dealing with children who are consistently disruptive?",
        "options": [
          "Time-out in a designated corner",
          "Verbal reprimands in front of the class",
          "Removing privileges for the entire day",
          "Observation and identification of underlying needs"
        ],
        "correctAnswer": 3,
        "explanation": "Effective management involves understanding what need the behavior is communicating and addressing the root cause."
      },
      {
        "id": 4,
        "question": "Which transition technique is most effective for preschool classrooms?",
        "options": [
          "Abruptly ending activities when time is up",
          "Using warnings, songs, or visual timers to signal upcoming transitions",
          "Allowing each child to finish at their own pace regardless of schedule",
          "Having no transitions to avoid disruption"
        ],
        "correctAnswer": 1,
        "explanation": "Predictable transition signals help children prepare mentally for changes in activities."
      },
      {
        "id": 5,
        "question": "What is the best way to handle a conflict between two children over a toy?",
        "options": [
          "Take the toy away so neither child can have it",
          "Give the toy to the child who had it first",
          "Help facilitate problem-solving between the children",
          "Distract both children with different toys"
        ],
        "correctAnswer": 2,
        "explanation": "Facilitating conflict resolution teaches valuable social skills and emotional regulation."
      },
      {
        "id": 6,
        "question": "Which of the following is a positive behavior guidance technique?",
        "options": [
          "Redirecting inappropriate behavior to appropriate activities",
          "Time-out for any misbehavior",
          "Withholding snacks when children misbehave",
          "Comparing children''s behavior to others"
        ],
        "correctAnswer": 0,
        "explanation": "Redirection acknowledges the child''s need while guiding them to meet it in an appropriate way."
      },
      {
        "id": 7,
        "question": "What is the primary goal of classroom management in early childhood education?",
        "options": [
          "To maintain perfect quiet at all times",
          "To create an environment conducive to learning and social development",
          "To ensure compliance with teacher directions",
          "To prevent all conflicts between children"
        ],
        "correctAnswer": 1,
        "explanation": "Effective classroom management creates an environment where children can learn, socialize, and develop in a positive way."
      },
      {
        "id": 8,
        "question": "How should a teacher respond when a child refuses to participate in a group activity?",
        "options": [
          "Insist that all children must participate equally",
          "Allow the child to sit out without checking in",
          "Offer alternative ways to engage or observe",
          "Remove the child from the room"
        ],
        "correctAnswer": 2,
        "explanation": "Respecting individual needs while offering different ways to engage acknowledges children''s autonomy while encouraging participation."
      }
    ]
  }'::JSONB
);

-- Add scenario response game for social-emotional learning
INSERT INTO educational_games (
  title, 
  description, 
  type, 
  difficulty, 
  category, 
  points_value, 
  config
)
VALUES (
  'Social-Emotional Classroom Scenarios', 
  'Practice responding to challenging social-emotional situations in the classroom environment.',
  'scenario-response',
  'hard',
  'social-emotional',
  20,
  '{
    "passingScore": 60,
    "scenarios": [
      {
        "id": 1,
        "situation": "Four-year-old Maya is playing in the block area when another child accidentally knocks over her tower. Maya immediately hits the other child and starts crying loudly.",
        "context": "This happens during free play time with 12 children in the classroom.",
        "responses": [
          {
            "id": 1,
            "text": "Remove Maya from the block area immediately and tell her she cannot play there for the rest of the day because she hit someone.",
            "quality": "poor",
            "explanation": "This response is punitive and doesn''t help Maya learn better ways to manage her emotions or solve problems.",
            "points": 0
          },
          {
            "id": 2,
            "text": "Acknowledge Maya''s feelings, ensure both children are safe, then help Maya express her feelings with words and work with both children to rebuild the tower together.",
            "quality": "best",
            "explanation": "This response addresses safety, acknowledges emotions, teaches alternative expressions of feelings, and supports problem-solving and relationship repair.",
            "points": 4
          },
          {
            "id": 3,
            "text": "Tell Maya that accidents happen and she needs to share the blocks and play nicely.",
            "quality": "fair",
            "explanation": "While this acknowledges that accidents happen, it dismisses Maya''s feelings and doesn''t teach her how to handle strong emotions appropriately.",
            "points": 1
          },
          {
            "id": 4,
            "text": "Comfort Maya and help her rebuild her tower, then talk with her privately about using words instead of hitting when she''s upset.",
            "quality": "good",
            "explanation": "This addresses Maya''s emotional needs and provides guidance, though it misses the opportunity to include the other child in problem-solving.",
            "points": 3
          }
        ]
      },
      {
        "id": 2,
        "situation": "During circle time, 5-year-old Jayden refuses to sit with the group and runs around the classroom disrupting others. This has happened several days in a row.",
        "context": "The behavior typically occurs during longer circle time activities.",
        "responses": [
          {
            "id": 1,
            "text": "Observe Jayden''s behavior patterns, then modify circle time to include more movement activities and provide Jayden with a fidget tool or special sitting spot. Meet with him before circle time to review expectations.",
            "quality": "best",
            "explanation": "This response addresses the underlying needs (movement, engagement) while maintaining appropriate expectations and providing support.",
            "points": 4
          },
          {
            "id": 2,
            "text": "Have an assistant take Jayden to another area until he''s ready to join the group appropriately.",
            "quality": "fair",
            "explanation": "While this stops the immediate disruption, it doesn''t address why Jayden is struggling or help him develop the skills to participate.",
            "points": 1
          },
          {
            "id": 3,
            "text": "Tell Jayden firmly that running is for outside and he needs to sit down right now or lose playtime privileges.",
            "quality": "poor",
            "explanation": "This approach uses threats and doesn''t address Jayden''s needs or teach him how to regulate himself during circle time.",
            "points": 0
          },
          {
            "id": 4,
            "text": "Give Jayden a special job during circle time, such as helping to hold props or turn pages, and position yourself near him to provide support.",
            "quality": "good",
            "explanation": "This gives Jayden positive attention and a purpose during circle time, though doesn''t address the potential need for movement or sensory input.",
            "points": 3
          }
        ]
      },
      {
        "id": 3,
        "situation": "Three-year-old Zoe is new to your class and cries every morning when her parent leaves, clinging to them and refusing to join activities.",
        "context": "Zoe has been in the class for two weeks and the separation anxiety isn''t improving.",
        "responses": [
          {
            "id": 1,
            "text": "Tell the parent to leave quickly without saying goodbye to avoid prolonging the crying.",
            "quality": "poor",
            "explanation": "Quick departures without goodbyes can increase anxiety and damage trust. Children need predictable goodbyes to build security.",
            "points": 0
          },
          {
            "id": 2,
            "text": "Work with the parent to create a consistent goodbye routine, comfort Zoe when she cries, and help her get engaged in a preferred activity. Take photos of her parent to look at during the day.",
            "quality": "best",
            "explanation": "This response creates predictability, acknowledges feelings, helps the child transition to engagement, and provides comfort objects.",
            "points": 4
          },
          {
            "id": 3,
            "text": "Allow the parent to stay for increasingly shorter periods each day until Zoe adjusts to the separation.",
            "quality": "good",
            "explanation": "A gradual transition can help some children, though the strategy needs to be consistently implemented and may not be feasible for all families.",
            "points": 3
          },
          {
            "id": 4,
            "text": "Distract Zoe with toys as soon as she starts crying and tell her she''s a big girl who doesn''t need to cry.",
            "quality": "fair",
            "explanation": "While distraction can sometimes help, dismissing emotions by telling children not to cry doesn''t support emotional development.",
            "points": 1
          }
        ]
      },
      {
        "id": 4,
        "situation": "During outdoor play, you notice 4-year-old Tyler repeatedly excluded from play by a group of children who tell him, ''You can''t play with us.''",
        "context": "This has happened several times, and Tyler is becoming withdrawn.",
        "responses": [
          {
            "id": 1,
            "text": "Tell the children they have to let everyone play who wants to join their game.",
            "quality": "fair",
            "explanation": "While inclusive, simply forcing inclusion without addressing social skills doesn''t teach children how to successfully integrate others into play.",
            "points": 1
          },
          {
            "id": 2,
            "text": "Join the children''s play and model including Tyler, highlighting his contributions and helping bridge his entry into the group.",
            "quality": "best",
            "explanation": "This models inclusive behavior, supports all children''s social skills, and creates a successful experience of group play.",
            "points": 4
          },
          {
            "id": 3,
            "text": "Take Tyler aside and coach him on specific phrases and actions he can use to join the play more successfully.",
            "quality": "good",
            "explanation": "Teaching social entry skills is valuable, though working only with the excluded child puts the responsibility solely on them.",
            "points": 3
          },
          {
            "id": 4,
            "text": "Find Tyler different children to play with and keep the groups separated.",
            "quality": "poor",
            "explanation": "This avoids addressing the exclusive behavior and doesn''t help either Tyler or the other children develop important social skills.",
            "points": 0
          }
        ]
      },
      {
        "id": 5,
        "situation": "Five-year-old Aiden has become upset during art time because he says his drawing of a dog ''doesn''t look right'' and he crumples it up in frustration.",
        "context": "Aiden often gets frustrated when his work doesn''t match his expectations.",
        "responses": [
          {
            "id": 1,
            "text": "Tell Aiden his drawing looked fine and he shouldn''t have crumpled it up.",
            "quality": "poor",
            "explanation": "This dismisses Aiden''s feelings and judgment about his own work, and focuses on what he ''should'' have done rather than supporting him.",
            "points": 0
          },
          {
            "id": 2,
            "text": "Give Aiden a pre-drawn dog outline to color in so he can be successful.",
            "quality": "fair",
            "explanation": "While this might prevent immediate frustration, it doesn''t help Aiden develop skills to manage perfectionism or build resilience.",
            "points": 1
          },
          {
            "id": 3,
            "text": "Acknowledge Aiden''s feelings of frustration, share a time when you felt similarly, and offer to help him try again with some specific techniques for drawing dogs.",
            "quality": "best",
            "explanation": "This validates emotions, normalizes struggle, offers support, and encourages persistence while teaching specific skills.",
            "points": 4
          },
          {
            "id": 4,
            "text": "Acknowledge Aiden''s frustration and suggest he take a break and try a different activity for now.",
            "quality": "good",
            "explanation": "This validates his feelings and offers a way to regulate emotions, though it misses the opportunity to build persistence through supported challenge.",
            "points": 2
          }
        ]
      }
    ]
  }'::JSONB
);

-- Add knowledge quiz for health & safety
INSERT INTO educational_games (
  title, 
  description, 
  type, 
  difficulty, 
  category, 
  points_value, 
  config
)
VALUES (
  'Health & Safety Essentials', 
  'Test your knowledge of critical health and safety practices in early childhood environments.',
  'knowledge-quiz',
  'easy',
  'health-safety',
  12,
  '{
    "passingScore": 80,
    "questions": [
      {
        "id": 1,
        "question": "When should teachers wash their hands in a preschool setting?",
        "options": [
          "Before and after handling food, after using the bathroom, and after helping children with toileting",
          "Only before eating or serving food",
          "Only after using the bathroom",
          "At the beginning and end of each day"
        ],
        "correctAnswer": 0,
        "explanation": "Frequent handwashing is the most effective way to prevent the spread of illness, especially during food handling and toileting."
      },
      {
        "id": 2,
        "question": "What is the appropriate water temperature for children to wash their hands?",
        "options": [
          "As hot as possible to kill germs",
          "Ice cold to wake up the children",
          "Lukewarm (90-110°F)",
          "Room temperature only"
        ],
        "correctAnswer": 2,
        "explanation": "Lukewarm water is comfortable for children while still being effective for cleaning when used with soap."
      },
      {
        "id": 3,
        "question": "What should be included in a classroom first aid kit?",
        "options": [
          "Adult medications, bandages, and disinfectant",
          "Bandages, disposable gloves, gauze pads, and scissors",
          "Only bandages and antiseptic cream",
          "Over-the-counter medications for children"
        ],
        "correctAnswer": 1,
        "explanation": "A basic first aid kit should include supplies to handle minor injuries safely without medications."
      },
      {
        "id": 4,
        "question": "How often should classroom toys be sanitized?",
        "options": [
          "Once a month is sufficient",
          "Only when they appear dirty",
          "Daily for items mouthed by children; weekly for other frequently used toys",
          "Annually during deep cleaning"
        ],
        "correctAnswer": 2,
        "explanation": "Items that go in children''s mouths need daily sanitizing, while other frequently-touched toys should be cleaned weekly to prevent illness transmission."
      },
      {
        "id": 5,
        "question": "What is the proper procedure if a child has a minor fall with a small scrape?",
        "options": [
          "Put a bandage on without cleaning it to avoid hurting the child",
          "Clean the wound with soap and water, apply antiseptic if appropriate, and cover if needed",
          "Apply ice regardless of whether there''s swelling",
          "Always call the parent immediately regardless of severity"
        ],
        "correctAnswer": 1,
        "explanation": "Proper wound cleaning prevents infection. Minor scrapes should be cleaned with soap and water before being covered."
      },
      {
        "id": 6,
        "question": "Which of these playground practices is safest?",
        "options": [
          "Allowing children to play unsupervised as long as the equipment is safe",
          "Active supervision with teachers positioned to see all areas",
          "Having just one teacher supervise the entire playground",
          "Letting older children supervise younger ones"
        ],
        "correctAnswer": 1,
        "explanation": "Active supervision with strategic positioning allows teachers to prevent accidents and respond quickly to any issues."
      },
      {
        "id": 7,
        "question": "What is the most common food allergen in young children?",
        "options": [
          "Strawberries",
          "Peanuts",
          "Chocolate",
          "Corn"
        ],
        "correctAnswer": 1,
        "explanation": "Peanut allergies are among the most common and can cause severe reactions in allergic children."
      },
      {
        "id": 8,
        "question": "What is the best practice for medication administration in preschool?",
        "options": [
          "Teachers can administer any medication that parents send in with verbal permission",
          "Medications should be stored in the classroom in case they''re needed",
          "Medications should be stored out of reach with written authorization and clear instructions",
          "Avoid giving any medications at school under any circumstances"
        ],
        "correctAnswer": 2,
        "explanation": "Proper medication storage and documentation protect both children and staff and ensure medications are administered correctly."
      }
    ]
  }'::JSONB
);