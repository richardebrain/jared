"""
Main FastAPI application for MentorMe Assessment API
This module sets up and configures the FastAPI application for the assessment system
"""

import logging
import os
import random
from typing import List, Dict, Any, Optional
from datetime import datetime

from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from backend.database import get_db, init_db, check_db_connection
from backend.models import (
    Question, Domain, User, UserAnswer, UserDomainProgress, School,
    Subscription, Achievement, UserAchievement
)
from backend.import_data import setup_initial_data

# Setup logging
logger = logging.getLogger("mentorme-assessment-api")

# Create FastAPI app
app = FastAPI(
    title="MentorMe Assessment API",
    description="API for MentorMe assessment system",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Configure CORS
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:8080",
    "http://127.0.0.1",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8080",
    "https://mentorme.repl.co",
    "https://*.repl.co",
    "https://*.replit.app",
]

# Add any additional origins from environment variables
if os.getenv("CORS_ORIGINS"):
    for origin in os.getenv("CORS_ORIGINS").split(","):
        if origin.strip():
            origins.append(origin.strip())

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for API requests and responses
class HealthCheck(BaseModel):
    """Health check response"""
    status: str
    version: str
    timestamp: datetime

class DomainStats(BaseModel):
    """Domain statistics"""
    total_questions: int
    difficulty_distribution: Dict[int, int]
    sub_domains: Optional[List[str]] = None

class AssessmentStart(BaseModel):
    """Assessment start request"""
    domain: str
    user_id: int
    sub_domain: Optional[str] = None
    difficulty: Optional[int] = None

class AnswerSubmission(BaseModel):
    """Answer submission request"""
    question_id: int
    answer: str
    user_id: int
    time_taken: Optional[int] = None
    session_id: Optional[str] = None

class QuestionResponse(BaseModel):
    """Question response model"""
    id: int
    question: str
    domain: str
    sub_domain: Optional[str] = None
    difficulty: int
    q_type: str
    options: Dict[str, str]
    hints: Optional[List[str]] = None
    time_limit: Optional[int] = None
    points_value: int

class AnswerResponse(BaseModel):
    """Answer response model"""
    is_correct: bool
    correct_answer: str
    explanation: Optional[str] = None
    points_earned: int
    message: str
    next_difficulty: int
    next_question: Optional[QuestionResponse] = None
    assessment_complete: bool = False
    completion_stats: Optional[Dict[str, Any]] = None

class UserProgress(BaseModel):
    """User progress model"""
    user_id: int
    domains: Dict[str, Dict[str, Any]]
    total_points: int
    total_questions_answered: int
    total_correct: int
    accuracy: float
    last_active: datetime

class LearningPathResponse(BaseModel):
    """Learning path response model"""
    user_id: int
    questions_asked: int
    questions_correct: int
    strongest_domain: str
    weakest_domain: str
    user_name: str
    total_points_earned: int
    recommendations: List[Dict[str, Any]]
    achievement_opportunities: List[Dict[str, Any]]

class LeaderboardEntry(BaseModel):
    """Leaderboard entry model"""
    user_id: int
    username: str
    full_name: str
    points: int
    level: int
    level_title: str
    rank: int
    profile_image_url: Optional[str] = None
    school_id: Optional[int] = None
    school_name: Optional[str] = None

@app.on_event("startup")
async def startup_event():
    """Startup event handler - initialize database and setup initial data"""
    try:
        # Initialize database
        init_db()
        logger.info("Database initialized")
        
        # Check database connection
        if check_db_connection():
            logger.info("Database connection verified")
        else:
            logger.error("Database connection failed")
        
        # Setup initial data
        if setup_initial_data():
            logger.info("Initial data setup complete")
        else:
            logger.warning("Initial data setup failed")
    except Exception as e:
        logger.error(f"Startup error: {str(e)}")

@app.get("/api/health", response_model=HealthCheck)
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "version": "1.0.0",
        "timestamp": datetime.utcnow()
    }

@app.get("/api/domains", response_model=List[Dict[str, Any]])
async def get_domains(db: Session = Depends(get_db)):
    """Get all available domains"""
    from backend.adapter import DatabaseAdapter
    return DatabaseAdapter.get_all_domains(db)
            # Add sub-domains
            sub_domains = db.query(Domain).filter(Domain.parent_id == domain.id).all()
            domain_dict["sub_domains"] = [sub.to_dict() for sub in sub_domains]
            result.append(domain_dict)
        
        return result
    except Exception as e:
        logger.error(f"Error getting domains: {str(e)}")
        raise HTTPException(status_code=500, detail="Error getting domains")

@app.get("/api/domains/{domain}/stats", response_model=DomainStats)
async def domain_statistics(domain: str, db: Session = Depends(get_db)):
    """Get statistics for a domain"""
    try:
        # Get questions count
        total_questions = db.query(Question).filter(
            Question.domain == domain,
            Question.is_active == True
        ).count()
        
        if total_questions == 0:
            raise HTTPException(status_code=404, detail="Domain not found or has no questions")
        
        # Get difficulty distribution
        difficulty_distribution = {}
        for difficulty in range(1, 6):
            count = db.query(Question).filter(
                Question.domain == domain,
                Question.difficulty == difficulty,
                Question.is_active == True
            ).count()
            if count > 0:
                difficulty_distribution[difficulty] = count
        
        # Get sub-domains
        sub_domains = db.query(Question.sub_domain).filter(
            Question.domain == domain,
            Question.is_active == True,
            Question.sub_domain.isnot(None)
        ).distinct().all()
        
        sub_domain_list = [sub[0] for sub in sub_domains if sub[0]]
        
        return {
            "total_questions": total_questions,
            "difficulty_distribution": difficulty_distribution,
            "sub_domains": sub_domain_list
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting domain statistics: {str(e)}")
        raise HTTPException(status_code=500, detail="Error getting domain statistics")

@app.post("/api/assessments/start", response_model=QuestionResponse)
async def start_assessment(
    request: AssessmentStart,
    db: Session = Depends(get_db)
):
    """Start a new assessment in the specified domain"""
    try:
        # Validate domain
        domain_obj = db.query(Domain).filter(Domain.name == request.domain).first()
        if not domain_obj:
            raise HTTPException(status_code=404, detail="Domain not found")
        
        # Validate user
        user = db.query(User).filter(User.id == request.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Find or create user progress for this domain
        progress = db.query(UserDomainProgress).filter(
            UserDomainProgress.user_id == request.user_id,
            UserDomainProgress.domain == request.domain
        ).first()
        
        if not progress:
            # Create new progress record
            progress = UserDomainProgress(
                user_id=request.user_id,
                domain=request.domain,
                questions_attempted=0,
                questions_correct=0,
                highest_difficulty=1,
                current_level=1,
                total_points=0,
                last_activity=datetime.utcnow()
            )
            db.add(progress)
            db.commit()
            db.refresh(progress)
        
        # Determine starting difficulty
        if request.difficulty:
            # Use requested difficulty if specified
            difficulty = request.difficulty
        else:
            # Use adaptive difficulty based on progress
            difficulty = progress.current_level
        
        # Get answered question IDs to exclude
        answered_ids = [
            ans.question_id for ans in db.query(UserAnswer).filter(
                UserAnswer.user_id == request.user_id,
                UserAnswer.is_correct == True
            ).all()
        ]
        
        # Query for a random question
        query = db.query(Question).filter(
            Question.domain == request.domain,
            Question.difficulty == difficulty,
            Question.is_active == True
        )
        
        # Add sub-domain filter if specified
        if request.sub_domain:
            query = query.filter(Question.sub_domain == request.sub_domain)
        
        # Exclude already answered questions if possible
        if answered_ids:
            query = query.filter(~Question.id.in_(answered_ids))
        
        # Get count of matching questions
        count = query.count()
        
        if count == 0:
            # If no questions at this difficulty, try other difficulties
            fallback_query = db.query(Question).filter(
                Question.domain == request.domain,
                Question.is_active == True
            )
            
            # Add sub-domain filter if specified
            if request.sub_domain:
                fallback_query = fallback_query.filter(Question.sub_domain == request.sub_domain)
            
            # Exclude already answered questions if possible
            if answered_ids:
                fallback_query = fallback_query.filter(~Question.id.in_(answered_ids))
            
            count = fallback_query.count()
            
            if count == 0:
                # If still no questions, try including already answered
                basic_query = db.query(Question).filter(
                    Question.domain == request.domain,
                    Question.is_active == True
                )
                
                # Add sub-domain filter if specified
                if request.sub_domain:
                    basic_query = basic_query.filter(Question.sub_domain == request.sub_domain)
                
                count = basic_query.count()
                
                if count == 0:
                    raise HTTPException(
                        status_code=404, 
                        detail="No questions available for this domain/sub-domain"
                    )
                
                # Use the basic query
                question = basic_query.offset(random.randint(0, count - 1)).first()
            else:
                # Use the fallback query
                question = fallback_query.offset(random.randint(0, count - 1)).first()
        else:
            # Use the original query
            question = query.offset(random.randint(0, count - 1)).first()
        
        # Update progress with last activity
        progress.last_activity = datetime.utcnow()
        db.commit()
        
        # Format response
        return {
            "id": question.id,
            "question": question.question,
            "domain": question.domain,
            "sub_domain": question.sub_domain,
            "difficulty": question.difficulty,
            "q_type": question.q_type,
            "options": question.options,
            "hints": question.hints,
            "time_limit": question.time_limit,
            "points_value": question.points_value
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting assessment: {str(e)}")
        raise HTTPException(status_code=500, detail="Error starting assessment")

@app.post("/api/assessments/answer", response_model=AnswerResponse)
async def submit_assessment_answer(
    request: AnswerSubmission,
    db: Session = Depends(get_db)
):
    """Submit an answer to an assessment question"""
    try:
        # Get question
        question = db.query(Question).filter(Question.id == request.question_id).first()
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")
        
        # Validate user
        user = db.query(User).filter(User.id == request.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check answer
        is_correct = False
        points_earned = 0
        message = "Incorrect. Try again."
        
        # Different checking logic based on question type
        if question.q_type == "multiple_choice":
            # For multiple choice, normalize to uppercase and check exact match
            is_correct = request.answer.strip().upper() == question.correct_answer.strip().upper()
        elif question.q_type == "true_false":
            # For true/false, convert to boolean-like string
            user_answer = request.answer.strip().lower()
            correct_answer = question.correct_answer.strip().lower()
            is_correct = (
                (user_answer in ["true", "t", "yes", "y", "1"] and 
                 correct_answer in ["true", "t", "yes", "y", "1"]) or
                (user_answer in ["false", "f", "no", "n", "0"] and 
                 correct_answer in ["false", "f", "no", "n", "0"])
            )
        else:
            # For other types, do a case-insensitive comparison
            is_correct = request.answer.strip().lower() == question.correct_answer.strip().lower()
        
        # Calculate points if correct
        if is_correct:
            points_earned = question.points_value
            message = "Correct! Great job."
        
        # Record answer
        answer_record = UserAnswer(
            user_id=request.user_id,
            question_id=request.question_id,
            answer=request.answer,
            is_correct=is_correct,
            points_earned=points_earned,
            time_taken=request.time_taken,
            session_id=request.session_id
        )
        db.add(answer_record)
        
        # Update user progress
        progress = db.query(UserDomainProgress).filter(
            UserDomainProgress.user_id == request.user_id,
            UserDomainProgress.domain == question.domain
        ).first()
        
        if not progress:
            # Create new progress record
            progress = UserDomainProgress(
                user_id=request.user_id,
                domain=question.domain,
                questions_attempted=1,
                questions_correct=1 if is_correct else 0,
                highest_difficulty=question.difficulty,
                current_level=question.difficulty,
                total_points=points_earned,
                last_activity=datetime.utcnow()
            )
            db.add(progress)
        else:
            # Update existing progress
            progress.questions_attempted += 1
            if is_correct:
                progress.questions_correct += 1
            progress.total_points += points_earned
            progress.last_activity = datetime.utcnow()
            
            # Update highest difficulty if this question is harder
            if question.difficulty > progress.highest_difficulty:
                progress.highest_difficulty = question.difficulty
        
        # Adaptive difficulty logic
        next_difficulty = question.difficulty
        
        if is_correct:
            # Get correct answers count at this difficulty
            correct_at_difficulty = db.query(UserAnswer).filter(
                UserAnswer.user_id == request.user_id,
                UserAnswer.is_correct == True,
                UserAnswer.question.has(Question.difficulty == question.difficulty),
                UserAnswer.question.has(Question.domain == question.domain)
            ).count()
            
            # Increase difficulty after several correct answers
            if correct_at_difficulty >= 3 and question.difficulty < 5:
                next_difficulty = question.difficulty + 1
                progress.current_level = next_difficulty
        else:
            # Get incorrect answers count at this difficulty
            incorrect_at_difficulty = db.query(UserAnswer).filter(
                UserAnswer.user_id == request.user_id,
                UserAnswer.is_correct == False,
                UserAnswer.question.has(Question.difficulty == question.difficulty),
                UserAnswer.question.has(Question.domain == question.domain)
            ).count()
            
            # Decrease difficulty after several incorrect answers
            if incorrect_at_difficulty >= 3 and question.difficulty > 1:
                next_difficulty = question.difficulty - 1
                progress.current_level = next_difficulty
        
        # Check if assessment is complete
        assessment_complete = False
        completion_stats = None
        
        # Assessment is complete when user has answered at least 10 questions
        # and has reached a proficiency score of at least 4
        if progress.questions_attempted >= 10 and progress.proficiency >= 4:
            assessment_complete = True
            progress.is_complete = True
            
            # Calculate completion stats
            completion_stats = {
                "questions_attempted": progress.questions_attempted,
                "questions_correct": progress.questions_correct,
                "accuracy": progress.accuracy,
                "proficiency": progress.proficiency,
                "highest_difficulty": progress.highest_difficulty,
                "total_points": progress.total_points
            }
        
        # Update user's total points
        if is_correct:
            user.total_points += points_earned
            user.level = user.check_level()
        
        db.commit()
        
        # Get next question if assessment not complete
        next_question = None
        if not assessment_complete:
            # Query for a random question at next difficulty
            query = db.query(Question).filter(
                Question.domain == question.domain,
                Question.difficulty == next_difficulty,
                Question.is_active == True,
                Question.id != question.id  # Exclude current question
            )
            
            # Add sub-domain filter if current question has one
            if question.sub_domain:
                query = query.filter(Question.sub_domain == question.sub_domain)
            
            # Get answered question IDs to exclude
            answered_ids = [
                ans.question_id for ans in db.query(UserAnswer).filter(
                    UserAnswer.user_id == request.user_id,
                    UserAnswer.is_correct == True
                ).all()
            ]
            
            # Exclude already answered questions if possible
            if answered_ids:
                query = query.filter(~Question.id.in_(answered_ids))
            
            # Get count of matching questions
            count = query.count()
            
            if count > 0:
                # Get random question
                next_q = query.offset(random.randint(0, count - 1)).first()
                next_question = {
                    "id": next_q.id,
                    "question": next_q.question,
                    "domain": next_q.domain,
                    "sub_domain": next_q.sub_domain,
                    "difficulty": next_q.difficulty,
                    "q_type": next_q.q_type,
                    "options": next_q.options,
                    "hints": next_q.hints,
                    "time_limit": next_q.time_limit,
                    "points_value": next_q.points_value
                }
        
        # Format response
        return {
            "is_correct": is_correct,
            "correct_answer": question.correct_answer,
            "explanation": question.explanation,
            "points_earned": points_earned,
            "message": message,
            "next_difficulty": next_difficulty,
            "next_question": next_question,
            "assessment_complete": assessment_complete,
            "completion_stats": completion_stats
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting answer: {str(e)}")
        raise HTTPException(status_code=500, detail="Error submitting answer")

@app.get("/api/users/{user_id}/progress", response_model=UserProgress)
async def get_user_progress(user_id: int, db: Session = Depends(get_db)):
    """Get progress for a user across all domains"""
    try:
        # Validate user
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get all progress records
        progress_records = db.query(UserDomainProgress).filter(
            UserDomainProgress.user_id == user_id
        ).all()
        
        # Group by domain
        domains = {}
        total_questions = 0
        total_correct = 0
        
        for progress in progress_records:
            domains[progress.domain] = progress.to_dict()
            total_questions += progress.questions_attempted
            total_correct += progress.questions_correct
        
        # Calculate overall accuracy
        accuracy = 0.0
        if total_questions > 0:
            accuracy = (total_correct / total_questions) * 100
        
        # Get last active time
        last_active = datetime.utcnow()
        if progress_records:
            last_progress = max(progress_records, key=lambda p: p.last_activity)
            last_active = last_progress.last_activity
        
        return {
            "user_id": user_id,
            "domains": domains,
            "total_points": user.total_points,
            "total_questions_answered": total_questions,
            "total_correct": total_correct,
            "accuracy": accuracy,
            "last_active": last_active
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user progress: {str(e)}")
        raise HTTPException(status_code=500, detail="Error getting user progress")

@app.get("/api/users/{user_id}/learning-path", response_model=LearningPathResponse)
async def get_learning_path(user_id: int, db: Session = Depends(get_db)):
    """Get a personalized learning path for a user"""
    try:
        # Validate user
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get progress records
        progress_records = db.query(UserDomainProgress).filter(
            UserDomainProgress.user_id == user_id
        ).all()
        
        # Get total questions and correct answers
        questions_asked = sum(p.questions_attempted for p in progress_records)
        questions_correct = sum(p.questions_correct for p in progress_records)
        
        # Identify strongest and weakest domains
        strongest_domain = "None yet"
        weakest_domain = "None yet"
        
        if progress_records:
            strongest = max(progress_records, key=lambda p: p.proficiency)
            strongest_domain = strongest.domain
            
            weakest = min(progress_records, key=lambda p: p.proficiency)
            weakest_domain = weakest.domain
        
        # Generate recommendations
        recommendations = []
        
        # Recommend domains with no progress
        all_domains = db.query(Domain).filter(Domain.parent_id.is_(None)).all()
        domains_with_progress = {p.domain for p in progress_records}
        
        for domain in all_domains:
            if domain.name not in domains_with_progress:
                recommendations.append({
                    "type": "new_domain",
                    "domain": domain.name,
                    "description": domain.description,
                    "message": f"Try questions in {domain.name} to expand your knowledge.",
                    "difficulty": 1
                })
        
        # Recommend harder questions in domains with good progress
        for progress in progress_records:
            if progress.proficiency >= 3 and progress.highest_difficulty < 5:
                recommendations.append({
                    "type": "harder_questions",
                    "domain": progress.domain,
                    "current_difficulty": progress.highest_difficulty,
                    "target_difficulty": progress.highest_difficulty + 1,
                    "message": f"You're doing well in {progress.domain}. Try more challenging questions!"
                })
        
        # Recommend review for domains with low accuracy
        for progress in progress_records:
            if progress.accuracy < 70 and progress.questions_attempted >= 5:
                recommendations.append({
                    "type": "review",
                    "domain": progress.domain,
                    "accuracy": progress.accuracy,
                    "message": f"Review concepts in {progress.domain} to improve your accuracy."
                })
        
        # Find achievement opportunities
        achievement_opportunities = []
        
        # Check for available achievements
        achievements = db.query(Achievement).filter(Achievement.is_active == True).all()
        earned_achievements = db.query(UserAchievement).filter(
            UserAchievement.user_id == user_id
        ).all()
        earned_ids = {a.achievement_id for a in earned_achievements}
        
        for achievement in achievements:
            if achievement.id in earned_ids:
                continue
                
            # Check if user qualifies for this achievement
            qualifies = False
            
            if achievement.requirement_type == "points":
                qualifies = user.total_points >= achievement.requirement_value
            elif achievement.requirement_type == "streak":
                qualifies = user.streak_days >= achievement.requirement_value
            elif achievement.requirement_type == "domain_mastery":
                # Check if any domain has proficiency 5
                for progress in progress_records:
                    if progress.proficiency >= 5:
                        qualifies = True
                        break
            
            if qualifies:
                achievement_opportunities.append({
                    "id": achievement.id,
                    "name": achievement.name,
                    "description": achievement.description,
                    "points_reward": achievement.points_reward,
                    "bear_bucks_reward": achievement.bear_bucks_reward
                })
        
        return {
            "user_id": user_id,
            "questions_asked": questions_asked,
            "questions_correct": questions_correct,
            "strongest_domain": strongest_domain,
            "weakest_domain": weakest_domain,
            "user_name": user.full_name,
            "total_points_earned": user.total_points,
            "recommendations": recommendations,
            "achievement_opportunities": achievement_opportunities
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting learning path: {str(e)}")
        raise HTTPException(status_code=500, detail="Error getting learning path")

@app.get("/api/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard(
    school_id: Optional[int] = None,
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get leaderboard data"""
    try:
        # Base query
        query = db.query(User).filter(User.is_active == True)
        
        # Filter by school if specified
        if school_id is not None:
            query = query.filter(User.school_id == school_id)
        
        # Order by points
        query = query.order_by(User.total_points.desc()).limit(limit)
        
        # Get users
        users = query.all()
        
        # Format response
        result = []
        for i, user in enumerate(users):
            school_name = None
            if user.school:
                school_name = user.school.name
                
            result.append({
                "user_id": user.id,
                "username": user.username,
                "full_name": user.full_name,
                "points": user.total_points,
                "level": user.level,
                "level_title": user.get_level_title(),
                "rank": i + 1,
                "profile_image_url": user.profile_image_url,
                "school_id": user.school_id,
                "school_name": school_name
            })
        
        return result
    except Exception as e:
        logger.error(f"Error getting leaderboard: {str(e)}")
        raise HTTPException(status_code=500, detail="Error getting leaderboard")