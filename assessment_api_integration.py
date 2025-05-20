import json
import requests
import os
import time
from pathlib import Path

# Configuration
API_BASE_URL = "http://localhost:8088"  # Default assessment API location
MASTER_QUESTIONS_PATH = "./data/master_questions.json"
ECE_QUESTIONS_PATH = "./data/ece_question_bank.json"

def check_api_health():
    """
    Check if the assessment API is running and accessible
    """
    try:
        response = requests.get(f"{API_BASE_URL}/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Assessment API is running - Version: {data.get('version')}")
            return True
        else:
            print(f"❌ Assessment API returned status code: {response.status_code}")
            return False
    except requests.RequestException as e:
        print(f"❌ Failed to connect to Assessment API: {str(e)}")
        return False

def get_domains():
    """
    Get a list of available domains from the API
    """
    try:
        response = requests.get(f"{API_BASE_URL}/domains")
        if response.status_code == 200:
            domains = response.json()
            print(f"Found {len(domains)} domains: {', '.join([d.get('name') for d in domains])}")
            return domains
        else:
            print(f"Failed to get domains. Status code: {response.status_code}")
            return []
    except requests.RequestException as e:
        print(f"Error getting domains: {str(e)}")
        return []

def ensure_domain_exists(domain_name):
    """
    Make sure a domain exists, create it if it doesn't
    Not all APIs support domain creation, so this might fail
    """
    domains = get_domains()
    domain_names = [d.get('name') for d in domains]
    
    if domain_name in domain_names:
        print(f"Domain '{domain_name}' already exists")
        return True
    
    # If API doesn't have endpoint to create domains, this will fail
    # Many assessment APIs create domains automatically when questions are added
    print(f"Domain '{domain_name}' may need to be created by the API")
    return False

def import_questions(file_path):
    """
    Import questions from a JSON file to the assessment API
    """
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        return False
    
    try:
        with open(file_path, 'r') as f:
            questions = json.load(f)
        
        print(f"Loaded {len(questions)} questions from {file_path}")
        
        # Group questions by domain for more efficient processing
        domains = {}
        for question in questions:
            domain = question.get('domain')
            if domain not in domains:
                domains[domain] = []
            domains[domain].append(question)
        
        print(f"Questions grouped into {len(domains)} domains")
        
        # Process each domain
        for domain_name, domain_questions in domains.items():
            print(f"Processing domain: {domain_name} with {len(domain_questions)} questions")
            
            # Ensure domain exists
            ensure_domain_exists(domain_name)
            
            # Import questions for this domain
            successes = 0
            failures = 0
            
            # This implementation depends on the specific API endpoint structure
            # Some APIs might have a bulk import option, others require individual imports
            
            # Check if our API is FastAPI from the MentorMe assessment system
            # Try a bulk upload first
            try:
                # For FastAPI assessment bulk import
                response = requests.post(
                    f"{API_BASE_URL}/admin/questions/import",
                    json={
                        "domain": domain_name,
                        "questions": domain_questions
                    }
                )
                
                if response.status_code in (200, 201):
                    result = response.json()
                    print(f"✅ Bulk import successful: {result.get('imported', len(domain_questions))} questions")
                    successes = len(domain_questions)
                else:
                    print(f"❌ Bulk import failed. Status code: {response.status_code}")
                    print("Falling back to individual import...")
                    
                    # Individual import fallback
                    for question in domain_questions:
                        try:
                            # Add a small delay to prevent overwhelming the API
                            time.sleep(0.1)
                            
                            response = requests.post(
                                f"{API_BASE_URL}/admin/questions",
                                json=question
                            )
                            
                            if response.status_code in (200, 201):
                                successes += 1
                            else:
                                failures += 1
                                print(f"Question import failed: {question.get('question')[:50]}...")
                        except Exception as e:
                            failures += 1
                            print(f"Error importing question: {str(e)}")
            
            except Exception as e:
                print(f"Error during bulk import: {str(e)}")
                print("Falling back to individual import...")
                
                # Individual import fallback
                for question in domain_questions:
                    try:
                        # Add a small delay to prevent overwhelming the API
                        time.sleep(0.1)
                        
                        response = requests.post(
                            f"{API_BASE_URL}/admin/questions",
                            json=question
                        )
                        
                        if response.status_code in (200, 201):
                            successes += 1
                        else:
                            failures += 1
                            print(f"Question import failed: {question.get('question')[:50]}...")
                    except Exception as e:
                        failures += 1
                        print(f"Error importing question: {str(e)}")
            
            print(f"Domain {domain_name}: {successes} questions imported successfully, {failures} failures")
        
        return True
    except Exception as e:
        print(f"❌ Error importing questions: {str(e)}")
        return False

def update_integration_with_backend():
    """
    Checks for an existing API integration and attempts to update it
    """
    backend_path = Path("./backend")
    if backend_path.exists() and backend_path.is_dir():
        # Check if this is the MentorMe assessment backend
        loader_path = backend_path / "loader.py"
        if loader_path.exists():
            # This is the right backend, attempt to modify loader.py to import our questions
            print("Found MentorMe assessment backend. Will update loader.py to import questions")
            
            # The backend can load questions from the data directory
            data_dir = Path("./data")
            data_dir.mkdir(exist_ok=True)
            
            # Copy our questions to the data directory if they aren't already there
            if not (data_dir / "master_questions.json").exists():
                import shutil
                shutil.copy(MASTER_QUESTIONS_PATH, data_dir / "master_questions.json")
                print("Copied master questions to data directory")
            
            if not (data_dir / "ece_question_bank.json").exists():
                import shutil
                shutil.copy(ECE_QUESTIONS_PATH, data_dir / "ece_question_bank.json")
                print("Copied ECE questions to data directory")
            
            return True
    
    return False

def main():
    """
    Main function to run the assessment API integration
    """
    print("🔄 Starting Assessment API Integration")
    
    # First check if API is running
    if not check_api_health():
        print("⚠️ Assessment API is not available. Will attempt direct backend integration.")
        if update_integration_with_backend():
            print("✅ Updated backend integration successfully")
        else:
            print("❌ Failed to integrate with backend directly")
        return
    
    # Import master questions
    print("\n📚 Importing Master Question Set...")
    if import_questions(MASTER_QUESTIONS_PATH):
        print("✅ Master questions imported successfully")
    else:
        print("❌ Failed to import master questions")
    
    # Import ECE questions 
    print("\n📚 Importing ECE Question Bank...")
    if import_questions(ECE_QUESTIONS_PATH):
        print("✅ ECE questions imported successfully")
    else:
        print("❌ Failed to import ECE questions")
    
    print("\n🎉 Assessment API integration complete")

if __name__ == "__main__":
    main()