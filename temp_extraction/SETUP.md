# Replit Setup for Master Training Tool

Follow these steps after uploading your project files:

1. **Unzip the Scaffold**  
   In Replit Shell, run:
   ```bash
   unzip training_app_updated.zip -d .
   ```

2. **Install Dependencies**  
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Secrets**  
   - Click the 🔒 “Secrets” icon in the left toolbar.  
   - Add `OPENAI_API_KEY` with your OpenAI API key.

4. **Ensure FastAPI Entry Point**  
   At the bottom of `backend/main.py`, add:
   ```python
   if __name__ == "__main__":
       import os
       import uvicorn
       port = int(os.environ.get("PORT", 8000))
       uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=True)
   ```

5. **Add `.replit` File**  
   Place this `.replit` file in the project root. It should contain:
   ```ini
   run = "bash -lc 'python3 backend/main.py'"
   ```

6. **(Optional) Front-End**  
   If including React in the same Repl:
   ```bash
   npx create-react-app frontend
   cd frontend
   npm install axios recharts
   ```
   - In `frontend/package.json`, add:
     ```json
     "proxy": "http://localhost:8000",
     ```
   - Update `.replit` run command to:
     ```ini
     run = "bash -lc 'uvicorn backend.main:app --host 0.0.0.0 --port $PORT & cd frontend && npm start'"
     ```

7. **Run**  
   Click **▶️ Run**. Your API will be live at:
   ```
   https://<your-repl-name>.repl.co/
   ```

You're all set to use your Master Training Tool on Replit!
