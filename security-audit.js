/**
 * Comprehensive Security Audit Script
 * Checks for common security vulnerabilities and best practices
 */

import fs from 'fs';
import path from 'path';

const securityIssues = [];
const recommendations = [];

function logIssue(severity, category, description, file = null, line = null) {
  securityIssues.push({
    severity,
    category,
    description,
    file,
    line,
    timestamp: new Date().toISOString()
  });
}

function logRecommendation(description, priority = 'medium') {
  recommendations.push({
    description,
    priority,
    timestamp: new Date().toISOString()
  });
}

function checkFileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

function readFileContent(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return null;
  }
}

function auditAuthenticationSecurity() {
  console.log('🔐 Auditing Authentication Security...');
  
  // Check server routes for authentication
  const routesContent = readFileContent('server/routes.ts');
  if (routesContent) {
    // Check for hardcoded passwords
    const hardcodedPasswords = routesContent.match(/password.*=.*["']([^"']+)["']/gi);
    if (hardcodedPasswords) {
      logIssue('high', 'Authentication', 'Hardcoded passwords found in routes', 'server/routes.ts');
    }
    
    // Check for admin password in code
    if (routesContent.includes('BIGSURF55')) {
      logIssue('critical', 'Authentication', 'Admin password hardcoded in source code', 'server/routes.ts');
    }
    
    // Check for session security
    if (routesContent.includes('session({') && !routesContent.includes('secure: true')) {
      logIssue('medium', 'Session', 'Session cookies not marked as secure', 'server/routes.ts');
    }
    
    // Check for rate limiting
    if (!routesContent.includes('rate-limit') && !routesContent.includes('rateLimit')) {
      logIssue('medium', 'Authentication', 'No rate limiting implemented for authentication endpoints', 'server/routes.ts');
    }
  }
  
  // Check for bcrypt usage
  const storageContent = readFileContent('server/storage.ts');
  if (storageContent) {
    if (storageContent.includes('bcrypt') || storageContent.includes('hash')) {
      console.log('✅ Password hashing detected');
    } else {
      logIssue('critical', 'Authentication', 'No password hashing detected', 'server/storage.ts');
    }
  }
}

function auditInputValidation() {
  console.log('🛡️ Auditing Input Validation...');
  
  const routesContent = readFileContent('server/routes.ts');
  if (routesContent) {
    // Check for SQL injection protection
    if (routesContent.includes('raw(') && !routesContent.includes('sql`')) {
      logIssue('high', 'SQL Injection', 'Raw SQL queries detected - potential SQL injection risk', 'server/routes.ts');
    }
    
    // Check for input sanitization
    if (!routesContent.includes('validator') && !routesContent.includes('zod')) {
      logIssue('medium', 'Input Validation', 'No input validation library detected', 'server/routes.ts');
    }
    
    // Check for XSS protection
    if (!routesContent.includes('helmet') && !routesContent.includes('xss')) {
      logIssue('medium', 'XSS', 'No XSS protection middleware detected', 'server/routes.ts');
    }
  }
}

function auditFileUploadSecurity() {
  console.log('📁 Auditing File Upload Security...');
  
  const routesContent = readFileContent('server/routes.ts');
  if (routesContent) {
    if (routesContent.includes('multer') || routesContent.includes('upload')) {
      // Check for file type validation
      if (!routesContent.includes('fileFilter') && !routesContent.includes('mimetype')) {
        logIssue('high', 'File Upload', 'File uploads without type validation detected', 'server/routes.ts');
      }
      
      // Check for file size limits
      if (!routesContent.includes('limits') && !routesContent.includes('fileSize')) {
        logIssue('medium', 'File Upload', 'File uploads without size limits detected', 'server/routes.ts');
      }
    }
  }
}

function auditEnvironmentSecurity() {
  console.log('🌍 Auditing Environment Security...');
  
  // Check for .env file
  if (checkFileExists('.env')) {
    const envContent = readFileContent('.env');
    if (envContent) {
      if (envContent.includes('password') || envContent.includes('secret')) {
        console.log('⚠️ Sensitive data in .env file - ensure it\'s not committed to version control');
      }
    }
  }
  
  // Check .gitignore
  if (checkFileExists('.gitignore')) {
    const gitignoreContent = readFileContent('.gitignore');
    if (gitignoreContent && !gitignoreContent.includes('.env')) {
      logIssue('high', 'Environment', '.env file not ignored in version control', '.gitignore');
    }
  } else {
    logIssue('medium', 'Environment', 'No .gitignore file found', null);
  }
}

function auditDependencySecurity() {
  console.log('📦 Auditing Dependencies...');
  
  const packageContent = readFileContent('package.json');
  if (packageContent) {
    const packageData = JSON.parse(packageContent);
    
    // Check for known vulnerable packages (basic check)
    const dependencies = { ...packageData.dependencies, ...packageData.devDependencies };
    
    // Check for security-related packages
    const securityPackages = ['helmet', 'rate-limiter-flexible', 'express-rate-limit', 'bcrypt'];
    const hasSecurityPackages = securityPackages.some(pkg => dependencies[pkg]);
    
    if (!hasSecurityPackages) {
      logIssue('medium', 'Dependencies', 'Consider adding security middleware packages', 'package.json');
    }
  }
}

function auditAPIEndpointSecurity() {
  console.log('🔌 Auditing API Endpoint Security...');
  
  const routesContent = readFileContent('server/routes.ts');
  if (routesContent) {
    // Check for endpoints without authentication
    const endpoints = routesContent.match(/app\.(get|post|put|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g);
    if (endpoints) {
      endpoints.forEach(endpoint => {
        if (!endpoint.includes('auth') && !endpoint.includes('login') && !endpoint.includes('public')) {
          // This is a basic check - would need more sophisticated analysis
        }
      });
    }
    
    // Check for CORS configuration
    if (!routesContent.includes('cors') && !routesContent.includes('Access-Control')) {
      logIssue('medium', 'CORS', 'No CORS configuration detected', 'server/routes.ts');
    }
  }
}

function auditClientSideSecurity() {
  console.log('🖥️ Auditing Client-Side Security...');
  
  // Check for sensitive data in client code
  const clientFiles = ['client/src/App.tsx', 'client/src/lib/queryClient.ts'];
  
  clientFiles.forEach(file => {
    const content = readFileContent(file);
    if (content) {
      // Check for API keys in client code
      if (content.includes('API_KEY') || content.includes('SECRET')) {
        logIssue('high', 'Client Security', 'Potential API keys in client-side code', file);
      }
      
      // Check for console.log statements
      const consoleStatements = content.match(/console\.(log|error|warn|info)/g);
      if (consoleStatements && consoleStatements.length > 5) {
        logIssue('low', 'Information Disclosure', 'Multiple console statements - may leak sensitive info in production', file);
      }
    }
  });
}

function generateSecurityReport() {
  console.log('\n🔍 SECURITY AUDIT REPORT');
  console.log('=' .repeat(50));
  
  // Group issues by severity
  const critical = securityIssues.filter(i => i.severity === 'critical');
  const high = securityIssues.filter(i => i.severity === 'high');
  const medium = securityIssues.filter(i => i.severity === 'medium');
  const low = securityIssues.filter(i => i.severity === 'low');
  
  console.log(`\n🚨 CRITICAL ISSUES: ${critical.length}`);
  critical.forEach(issue => {
    console.log(`  - ${issue.description} ${issue.file ? `(${issue.file})` : ''}`);
  });
  
  console.log(`\n⚠️ HIGH ISSUES: ${high.length}`);
  high.forEach(issue => {
    console.log(`  - ${issue.description} ${issue.file ? `(${issue.file})` : ''}`);
  });
  
  console.log(`\n📝 MEDIUM ISSUES: ${medium.length}`);
  medium.forEach(issue => {
    console.log(`  - ${issue.description} ${issue.file ? `(${issue.file})` : ''}`);
  });
  
  console.log(`\n💡 LOW ISSUES: ${low.length}`);
  low.forEach(issue => {
    console.log(`  - ${issue.description} ${issue.file ? `(${issue.file})` : ''}`);
  });
  
  console.log(`\n📋 RECOMMENDATIONS:`);
  recommendations.forEach(rec => {
    console.log(`  - [${rec.priority.toUpperCase()}] ${rec.description}`);
  });
  
  // Overall security score
  const totalIssues = securityIssues.length;
  const criticalWeight = critical.length * 10;
  const highWeight = high.length * 5;
  const mediumWeight = medium.length * 2;
  const lowWeight = low.length * 1;
  
  const totalWeight = criticalWeight + highWeight + mediumWeight + lowWeight;
  const maxScore = 100;
  const securityScore = Math.max(0, maxScore - totalWeight);
  
  console.log(`\n📊 SECURITY SCORE: ${securityScore}/100`);
  
  if (securityScore >= 80) {
    console.log('✅ GOOD: Application has strong security posture');
  } else if (securityScore >= 60) {
    console.log('⚠️ MODERATE: Several security improvements needed');
  } else {
    console.log('❌ POOR: Critical security issues need immediate attention');
  }
  
  console.log('\n' + '='.repeat(50));
}

async function runSecurityAudit() {
  console.log('🔒 Starting Comprehensive Security Audit...\n');
  
  try {
    auditAuthenticationSecurity();
    auditInputValidation();
    auditFileUploadSecurity();
    auditEnvironmentSecurity();
    auditDependencySecurity();
    auditAPIEndpointSecurity();
    auditClientSideSecurity();
    
    // Add general recommendations
    logRecommendation('Implement Content Security Policy (CSP) headers', 'high');
    logRecommendation('Add request rate limiting to prevent abuse', 'high');
    logRecommendation('Use HTTPS in production with proper SSL certificates', 'critical');
    logRecommendation('Implement proper logging and monitoring for security events', 'medium');
    logRecommendation('Regular security updates for all dependencies', 'high');
    logRecommendation('Implement proper error handling without information disclosure', 'medium');
    
    generateSecurityReport();
    
  } catch (error) {
    console.error('Error during security audit:', error);
  }
}

// Run the audit
runSecurityAudit().catch(console.error);