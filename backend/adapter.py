"""
Database adapter module for the MentorMe assessment system
This module provides compatibility between the assessment system models
and the existing database structure.
"""

import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text

# Setup logging
logger = logging.getLogger("mentorme-assessment-api")

class DatabaseAdapter:
    """
    Adapter class to handle database operations between the
    assessment system and the existing database structure
    """
    
    @staticmethod
    def get_school_by_name(db: Session, name: str) -> Optional[Dict[str, Any]]:
        """
        Get school by name from existing database
        Returns a dictionary representation of the school
        """
        try:
            query = text("""
                SELECT id, name, contact_email, logo_url, 
                       subscription_active, is_free_access, teacher_count
                FROM schools
                WHERE name = :name
                LIMIT 1
            """)
            
            result = db.execute(query, {"name": name}).fetchone()
            
            if not result:
                return None
                
            return {
                "id": result[0],
                "name": result[1],
                "contact_email": result[2],
                "logo_url": result[3],
                "subscription_active": result[4],
                "is_free_access": result[5],
                "teacher_count": result[6]
            }
        except Exception as e:
            logger.error(f"Error getting school by name: {str(e)}")
            return None
    
    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> Optional[Dict[str, Any]]:
        """
        Get user by ID from existing database
        Returns a dictionary representation of the user
        """
        try:
            query = text("""
                SELECT id, username, email, "firstName", "lastName", 
                       "profilePicture", points, level, "schoolId"
                FROM users
                WHERE id = :user_id
                LIMIT 1
            """)
            
            result = db.execute(query, {"user_id": user_id}).fetchone()
            
            if not result:
                return None
                
            return {
                "id": result[0],
                "username": result[1],
                "email": result[2],
                "first_name": result[3],
                "last_name": result[4],
                "profile_image_url": result[5],
                "total_points": result[6],
                "level": result[7],
                "school_id": result[8]
            }
        except Exception as e:
            logger.error(f"Error getting user by ID: {str(e)}")
            return None
    
    @staticmethod
    def get_questions_by_domain(db: Session, domain: str, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get questions from a specific domain
        Returns a list of questions in dictionary format
        """
        try:
            query = text("""
                SELECT id, question, domain, sub_domain, difficulty, 
                       q_type, options, correct_answer, points, 
                       time_limit, tags
                FROM questions
                WHERE domain = :domain
                LIMIT :limit
            """)
            
            results = db.execute(query, {"domain": domain, "limit": limit}).fetchall()
            
            questions = []
            for row in results:
                options = row[6]
                # Try to parse options from string if needed
                if options and isinstance(options, str):
                    try:
                        import ast
                        options = ast.literal_eval(options)
                    except:
                        options = {}
                
                questions.append({
                    "id": row[0],
                    "question": row[1],
                    "domain": row[2],
                    "sub_domain": row[3],
                    "difficulty": row[4],
                    "q_type": row[5],
                    "options": options or {},
                    "correct_answer": row[7],
                    "points": row[8] or (row[4] * 5),  # Default points based on difficulty
                    "time_limit": row[9],
                    "tags": row[10]
                })
            
            return questions
        except Exception as e:
            logger.error(f"Error getting questions by domain: {str(e)}")
            return []
    
    @staticmethod
    def get_question_by_id(db: Session, question_id: int) -> Optional[Dict[str, Any]]:
        """
        Get a question by ID
        Returns a dictionary representation of the question
        """
        try:
            query = text("""
                SELECT id, question, domain, sub_domain, difficulty, 
                       q_type, options, correct_answer, points, 
                       time_limit, tags
                FROM questions
                WHERE id = :question_id
                LIMIT 1
            """)
            
            row = db.execute(query, {"question_id": question_id}).fetchone()
            
            if not row:
                return None
            
            options = row[6]
            # Try to parse options from string if needed
            if options and isinstance(options, str):
                try:
                    import ast
                    options = ast.literal_eval(options)
                except:
                    options = {}
            
            return {
                "id": row[0],
                "question": row[1],
                "domain": row[2],
                "sub_domain": row[3],
                "difficulty": row[4],
                "q_type": row[5],
                "options": options or {},
                "correct_answer": row[7],
                "points": row[8] or (row[4] * 5),  # Default points based on difficulty
                "time_limit": row[9],
                "tags": row[10]
            }
        except Exception as e:
            logger.error(f"Error getting question by ID: {str(e)}")
            return None
    
    @staticmethod
    def update_user_points(db: Session, user_id: int, points_to_add: int) -> bool:
        """
        Update a user's points
        Returns True if successful, False otherwise
        """
        try:
            query = text("""
                UPDATE users
                SET points = points + :points_to_add,
                    "lastActive" = NOW()
                WHERE id = :user_id
            """)
            
            db.execute(query, {"user_id": user_id, "points_to_add": points_to_add})
            db.commit()
            return True
        except Exception as e:
            logger.error(f"Error updating user points: {str(e)}")
            db.rollback()
            return False
    
    @staticmethod
    def record_assessment_answer(
        db: Session, 
        user_id: int, 
        question_id: int, 
        user_answer: str, 
        is_correct: bool,
        points_earned: int
    ) -> bool:
        """
        Record a user's answer to an assessment question
        Returns True if successful, False otherwise
        """
        try:
            # Check if our assessment_answers table exists
            result = db.execute(text("""
                SELECT EXISTS (
                   SELECT FROM information_schema.tables 
                   WHERE table_name = 'assessment_answers'
                )
            """)).scalar()
            
            if not result:
                # Create the table if it doesn't exist
                db.execute(text("""
                    CREATE TABLE IF NOT EXISTS assessment_answers (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER NOT NULL,
                        question_id INTEGER NOT NULL,
                        user_answer TEXT NOT NULL,
                        is_correct BOOLEAN NOT NULL,
                        points_earned INTEGER NOT NULL,
                        created_at TIMESTAMP NOT NULL DEFAULT NOW()
                    )
                """))
                db.commit()
            
            # Insert the answer
            query = text("""
                INSERT INTO assessment_answers 
                (user_id, question_id, user_answer, is_correct, points_earned)
                VALUES (:user_id, :question_id, :user_answer, :is_correct, :points_earned)
            """)
            
            db.execute(query, {
                "user_id": user_id,
                "question_id": question_id,
                "user_answer": user_answer,
                "is_correct": is_correct,
                "points_earned": points_earned
            })
            
            db.commit()
            return True
        except Exception as e:
            logger.error(f"Error recording assessment answer: {str(e)}")
            db.rollback()
            return False
    
    @staticmethod
    def get_all_domains(db: Session) -> List[Dict[str, Any]]:
        """
        Get all available domains
        Returns a list of domains in dictionary format
        """
        try:
            # First try to get domains from the domains table
            try:
                query = text("""
                    SELECT EXISTS (
                       SELECT FROM information_schema.tables 
                       WHERE table_name = 'domains'
                    )
                """)
                has_domains_table = db.execute(query).scalar()
                
                if has_domains_table:
                    query = text("""
                        SELECT id, name, description, parent_id
                        FROM domains
                        WHERE is_active = true
                    """)
                    results = db.execute(query).fetchall()
                    
                    if results:
                        domains = []
                        for row in results:
                            domains.append({
                                "id": row[0],
                                "name": row[1],
                                "description": row[2],
                                "parent_id": row[3],
                                "is_active": True
                            })
                        return domains
            except Exception as e:
                logger.warning(f"Error accessing domains table: {str(e)}")
            
            # Fallback: Get distinct domains from questions table
            query = text("""
                SELECT DISTINCT domain, COUNT(*) as question_count
                FROM questions
                GROUP BY domain
                ORDER BY domain
            """)
            
            results = db.execute(query).fetchall()
            
            domains = []
            for i, row in enumerate(results):
                domains.append({
                    "id": i + 1,
                    "name": row[0],
                    "description": f"Contains {row[1]} questions",
                    "parent_id": None,
                    "is_active": True
                })
            
            return domains
        except Exception as e:
            logger.error(f"Error getting all domains: {str(e)}")
            return []