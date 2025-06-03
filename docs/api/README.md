# Assessment Session Management API Documentation

This directory contains the OpenAPI 3.0 specification for the Assessment Session Management API endpoints implemented in EP-001-07.

## Files

- `assessment-session-api.yaml` - Complete OpenAPI 3.0 specification for all assessment session endpoints

## Overview

The Assessment Session Management API provides 5 core endpoints for managing Teacher assessment sessions:

1. **`POST /api/assessment/session/start`** - Create new assessment session
2. **`GET /api/assessment/session/status`** - Get current session progress  
3. **`POST /api/assessment/session/answer`** - Submit question answers
4. **`POST /api/assessment/session/complete`** - Finalize assessment and get results
5. **`GET /api/assessment/session/abandon`** - Handle session abandonment

## Key Features

### 🔒 Security & Access Control
- **Educator Role Only**: Restricted to eligible educators (teachers, school directors, platform owners)
- **Session-based Authentication**: Uses Express session cookies
- **One-Time Assessment Rule**: Each teacher can complete initial assessment only once

### 📊 Assessment Features
- **40-Question Assessment**: Configurable question count (default 40)
- **6-Level Difficulty System**: Adaptive difficulty with 6 levels (1-6)
- **10 ECE Domains**: Weighted question distribution across domains
- **Scoring System**: 5,8,10,13,15,20 points for difficulty levels 1-6
- **Complete Journey Tracking**: Full sequence and timing data

### 📈 Progress & Results
- **Real-time Progress**: Track questions answered, sequence position, domain coverage
- **Teacher-Focused Results**: Strengths (≥80% accuracy) and growth areas (<60% accuracy)
- **Domain Analysis**: Performance breakdown by ECE domain
- **Personalized Feedback**: Summary messages and next steps recommendations

## Using the API Specification

### Swagger UI Integration
You can use this OpenAPI specification with Swagger UI for interactive documentation and testing:

```bash
# Install swagger-ui-express (if not already installed)
npm install swagger-ui-express

# Serve the API documentation
npx swagger-ui-serve assessment-session-api.yaml
```

### Frontend Development
The specification provides complete TypeScript interfaces and can be used with code generation tools:

```bash
# Generate TypeScript client (example with openapi-generator)
npx @openapitools/openapi-generator-cli generate \
  -i assessment-session-api.yaml \
  -g typescript-axios \
  -o ./src/api/generated
```

### Postman Collection
You can import the OpenAPI specification directly into Postman for API testing.

## Authentication

All endpoints require session-based authentication:

```javascript
// Frontend requests should include credentials
fetch('/api/assessment/session/start', {
  method: 'POST',
  credentials: 'include', // Important for session cookies
  headers: {
    'Content-Type': 'application/json'
  }
});
```

## Example Assessment Flow

```javascript
// 1. Start assessment session
const startResponse = await fetch('/api/assessment/session/start', {
  method: 'POST',
  credentials: 'include'
});
const { session } = await startResponse.json();

// 2. Submit answers for each question
for (let i = 1; i <= session.config.questionCount; i++) {
  const answerResponse = await fetch('/api/assessment/session/answer', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      assessmentId: session.assessmentId,
      questionId: questionId,
      selectedAnswer: selectedIndex,
      responseTime: timeSpent
    })
  });
  
  const result = await answerResponse.json();
  if (result.assessment.completed) {
    break; // Assessment is complete
  }
}

// 3. Complete assessment and get results
const completeResponse = await fetch('/api/assessment/session/complete', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    assessmentId: session.assessmentId
  })
});
const { results } = await completeResponse.json();
```

## Error Handling

The API provides detailed error responses with consistent structure:

```typescript
interface ErrorResponse {
  message: string;
  details: string;
  code?: string;
}
```

Common error scenarios:
- **401**: Authentication required
- **403**: Educator role required
- **409**: Assessment already completed (one-time rule)
- **404**: No active session or session/question not found
- **400**: Invalid request data

## Validation Rules

### Answer Submission
- `assessmentId`: Required, must be valid active session
- `questionId`: Required, must exist in question pool
- `selectedAnswer`: Required unless `timedOut` is true
- `responseTime`: Optional, time in seconds
- `timedOut`: Optional boolean, defaults to false

### Session Management
- Only one active session per teacher allowed
- Session ownership strictly validated
- Question sequence automatically managed
- Timeout handling preserves partial progress

## Data Models

The specification includes comprehensive data models for:
- **Session Configuration**: Question count, time limits, difficulty settings
- **Domain Information**: 10 ECE domains with weights and descriptions  
- **Progress Tracking**: Questions answered, sequences, percentages
- **Results**: Strengths, growth areas, scores, and recommendations
- **Error Responses**: Consistent error handling across all endpoints

For complete details, see the OpenAPI specification file. 