#!/bin/bash
echo "🧪 Testing AI Features Across Platform..."
echo

# Test 1: Lesson Plan Generator
echo "📚 Testing Lesson Plan Generator..."
curl -X POST http://localhost:5000/api/ai/lesson-plan \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=test" \
  -d '{
    "ageGroup": "3-4 years",
    "theme": "Colors and Shapes",
    "details": "Focus on primary colors and basic shapes",
    "additionalRequests": "include art activities and sensory play"
  }' -w "\nHTTP Status: %{http_code}\n" --max-time 30

echo
echo "🎭 Testing Seussifier Generator..."
curl -X POST http://localhost:5000/api/perplexity/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=test" \
  -d '{
    "prompt": "Create a short, fun Dr. Seuss style poem about Emma sharing her toys with friends"
  }' -w "\nHTTP Status: %{http_code}\n" --max-time 30

echo
echo "🎯 Testing Meeting Agenda Generator..."
curl -X POST http://localhost:5000/api/ai-suggestions/generate-meeting-agenda \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=test" \
  -d '{
    "meetingType": "Staff Meeting",
    "duration": "60",
    "primaryFocus": "Classroom Management",
    "attendees": "Teaching staff",
    "schoolGoals": "Improve student engagement"
  }' -w "\nHTTP Status: %{http_code}\n" --max-time 30

echo
echo "✅ AI Features Test Complete"