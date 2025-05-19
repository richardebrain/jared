#!/bin/bash
# Script to start the MentorMe Assessment API server

# Set variables
PORT=8088
HOST="0.0.0.0"
RELOAD=true

# Print banner
echo "========================================================"
echo "  Starting MentorMe Assessment API Server"
echo "  Host: $HOST"
echo "  Port: $PORT"
echo "  Auto-reload: $RELOAD"
echo "========================================================"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is required but not installed."
    exit 1
fi

# Check if required Python packages are installed
echo "Checking required packages..."
REQUIRED_PACKAGES=("fastapi" "uvicorn" "sqlalchemy" "pydantic" "psycopg2-binary")
MISSING_PACKAGES=()

for package in "${REQUIRED_PACKAGES[@]}"; do
    if ! python3 -c "import $package" 2>/dev/null; then
        MISSING_PACKAGES+=("$package")
    fi
done

if [ ${#MISSING_PACKAGES[@]} -gt 0 ]; then
    echo "The following required packages are missing:"
    for package in "${MISSING_PACKAGES[@]}"; do
        echo "  - $package"
    done
    
    echo "Installing missing packages..."
    python3 -m pip install ${MISSING_PACKAGES[@]}
    
    # Verify installation
    STILL_MISSING=()
    for package in "${MISSING_PACKAGES[@]}"; do
        if ! python3 -c "import $package" 2>/dev/null; then
            STILL_MISSING+=("$package")
        fi
    done
    
    if [ ${#STILL_MISSING[@]} -gt 0 ]; then
        echo "Error: Failed to install the following packages:"
        for package in "${STILL_MISSING[@]}"; do
            echo "  - $package"
        done
        echo "Please install them manually and try again."
        exit 1
    fi
fi

# Create data directory if it doesn't exist
if [ ! -d "data" ]; then
    echo "Creating data directory..."
    mkdir -p data
fi

# Check if sample_questions.csv exists
if [ ! -f "data/sample_questions.csv" ]; then
    echo "Creating sample questions file..."
    cat > data/sample_questions.csv << EOL
question,domain,sub_domain,difficulty,type,correct_answer,option_a,option_b,option_c,option_d,explanation,hints,resources
"What is the primary purpose of ITERS (Infant/Toddler Environment Rating Scale)?",Assessment,Classroom Quality,2,multiple_choice,A,"To assess the quality of care provided in infant and toddler classrooms","To measure children's cognitive development","To evaluate teacher qualifications","To track children's physical growth","ITERS is specifically designed to assess classroom quality and environment for infants and toddlers, focusing on space and furnishings, personal care routines, listening and talking, activities, interaction, program structure, and parents and staff.","Think about what assessment tools are used in early childhood classrooms.","https://ers.fpg.unc.edu/infanttoddler-environment-rating-scale-iters-r"
"Which of the following is NOT one of the domains of the CLASS (Classroom Assessment Scoring System) tool?",Assessment,Classroom Quality,3,multiple_choice,D,"Emotional Support","Classroom Organization","Instructional Support","Physical Development","The CLASS tool focuses on measuring teacher-child interactions in three domains: Emotional Support, Classroom Organization, and Instructional Support. Physical Development is not a domain measured by CLASS.","CLASS focuses on interactions rather than physical development.","https://teachstone.com/class/"
"According to developmentally appropriate practice, what is the recommended approach when children show interest in learning to write their names?",Teaching Practices,Developmentally Appropriate Practice,2,multiple_choice,B,"Provide daily handwriting worksheets until they master it","Offer varied opportunities and materials for writing exploration","Wait until they are in kindergarten to introduce writing","Focus exclusively on correct letter formation","Developmentally appropriate practice suggests providing children with multiple, meaningful opportunities to explore writing in various contexts rather than focusing solely on correct formation or using only worksheets.","Think about what approach respects children's natural curiosity while supporting skill development.","https://www.naeyc.org/resources/topics/dap/position-statement"
"In Piaget's theory of cognitive development, what characterizes the preoperational stage?",Child Development,Cognitive Development,3,multiple_choice,C,"Object permanence and reflexive behavior","Formal logical thinking and abstract reasoning","Symbolic thinking and egocentrism","Systematic problem solving and classification skills","The preoperational stage (approximately ages 2-7) is characterized by the development of symbolic thinking (using words and images to represent objects) and egocentrism (difficulty seeing perspectives other than their own).","This stage typically occurs between toddlerhood and early elementary years.","https://www.simplypsychology.org/preoperational.html"
"What is the zone of proximal development in Vygotsky's sociocultural theory?",Child Development,Cognitive Development,4,multiple_choice,A,"The difference between what a learner can do without help and what they can do with guidance","The period when children develop basic motor skills","The process of learning through observation and imitation","The maximum cognitive capacity of a child at a given age","Vygotsky's zone of proximal development (ZPD) describes the gap between what a child can accomplish independently and what they can do with support from a more knowledgeable person.","This concept is closely related to the idea of 'scaffolding' in education.","https://www.simplypsychology.org/Zone-of-Proximal-Development.html"
"True or false: Secure attachment in infancy is strongly linked to later academic success.",Child Development,Social-Emotional Development,3,true_false,true,"","","","","Research shows that secure attachment provides a foundation for exploration and learning. Children with secure attachment histories tend to have better emotional regulation, social skills, and academic engagement, which contribute to academic success.","Consider the relationship between emotional security and learning readiness.","https://srcd.onlinelibrary.wiley.com/doi/abs/10.1111/j.1467-8624.2009.01380.x"
"What is the primary purpose of play in early childhood development?",Play,Play-Based Learning,1,multiple_choice,B,"To keep children busy while adults work","To develop skills across all developmental domains","To prepare children specifically for academic learning","To expend excess energy","Play is the primary vehicle for development in early childhood, supporting cognitive, physical, social, emotional, and language development simultaneously.","Think holistically about what children gain through different types of play.","https://www.naeyc.org/resources/topics/play"
"Which area of the brain is primarily responsible for executive function skills?",Child Development,Brain Development,4,multiple_choice,C,"Cerebellum","Temporal lobe","Prefrontal cortex","Hippocampus","The prefrontal cortex is responsible for executive function skills such as planning, working memory, inhibitory control, and cognitive flexibility. This area continues developing into early adulthood.","This brain region is one of the last to fully mature.","https://developingchild.harvard.edu/science/key-concepts/executive-function/"
"What is emergent curriculum in early childhood education?",Curriculum,Educational Approaches,3,multiple_choice,A,"Curriculum that develops based on children's interests and experiences","A standardized curriculum with predetermined learning objectives","Curriculum focused exclusively on academic readiness","A behavior management approach","Emergent curriculum is a philosophy that develops curriculum based on the children's interests and experiences. It is responsive, flexible, and co-constructed with children rather than predetermined.","Think about who has input into curriculum decisions in this approach.","https://www.naeyc.org/resources/pubs/yc/nov2016/emergent-curriculum"
"Which statement about rough-and-tumble play is most accurate?",Play,Types of Play,2,multiple_choice,D,"It should always be prohibited in early childhood settings","It only benefits physical development","It is only appropriate for school-age children","It supports social skills and emotional regulation when properly supervised","When appropriately supervised, rough-and-tumble play helps children learn boundaries, understand non-verbal cues, regulate emotions, and develop physical coordination.","Consider the benefits beyond just physical activity.","https://www.tandfonline.com/doi/abs/10.1080/03004430.2016.1237564"
EOL
fi

# Start server with Python
echo "Starting FastAPI server..."
python3 run_backend.py --host "$HOST" --port "$PORT" --reload