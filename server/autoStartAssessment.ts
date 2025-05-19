import { exec } from 'child_process';
import { log } from './vite';

/**
 * Starts the assessment API in the background
 * This ensures the assessment service is always available without manual intervention
 */
export function startAssessmentApi(): void {
  log('Starting assessment API in the background...');
  
  const child = exec('bash start_assessment_api.sh', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error starting assessment API: ${error.message}`);
      return;
    }
    
    if (stderr) {
      console.error(`Assessment API stderr: ${stderr}`);
    }
    
    if (stdout) {
      // Only log important parts of the output to avoid cluttering the console
      const lines = stdout.split('\n').filter(line => 
        line.includes('Starting') || 
        line.includes('Error') || 
        line.includes('running on') ||
        line.includes('MentorMe Assessment API')
      );
      
      if (lines.length > 0) {
        log(`Assessment API output: ${lines.join(' | ')}`);
      }
    }
  });
  
  // Prevent the child process from blocking the main process from exiting
  child.unref();
  
  log('Assessment API startup initiated');
}