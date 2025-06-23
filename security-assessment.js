/**
 * Comprehensive Security Assessment for MentorMe ECE Platform
 * Analyzes current security measures and identifies potential vulnerabilities
 */

import fs from 'fs';
import path from 'path';

class SecurityAssessment {
  constructor() {
    this.findings = {
      critical: [],
      high: [],
      medium: [],
      low: [],
      info: []
    };
    this.strengths = [];
  }

  assessAuthentication() {
    console.log('🔍 Assessing Authentication Security...');
    
    // Check password hashing
    try {
      const routesContent = fs.readFileSync('server/routes.ts', 'utf8');
      
      if (routesContent.includes('bcrypt')) {
        this.strengths.push('✓ Password hashing with bcrypt implemented');
      } else {
        this.findings.critical.push('❌ No password hashing detected');
      }

      if (routesContent.includes('session')) {
        this.strengths.push('✓ Session-based authentication implemented');
      }

      if (routesContent.includes('requireAuth')) {
        this.strengths.push('✓ Route protection middleware in place');
      }

      // Check for session security
      if (routesContent.includes('SessionSecurityManager')) {
        this.strengths.push('✓ Advanced session security with concurrent limits');
      }

    } catch (error) {
      this.findings.high.push('❌ Unable to analyze authentication code');
    }
  }

  assessDatabaseSecurity() {
    console.log('🔍 Assessing Database Security...');
    
    try {
      const dbContent = fs.readFileSync('server/db.ts', 'utf8');
      const routesContent = fs.readFileSync('server/routes.ts', 'utf8');
      
      if (dbContent.includes('drizzle') && routesContent.includes('eq(')) {
        this.strengths.push('✓ Parameterized queries with Drizzle ORM');
      }

      if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('ssl=true')) {
        this.strengths.push('✓ SSL/TLS encrypted database connections');
      } else {
        this.findings.medium.push('⚠️ Database connection encryption status unclear');
      }

      // Check for SQL injection prevention
      if (!routesContent.includes('sql`') || routesContent.includes('sql(`')) {
        this.findings.medium.push('⚠️ Potential raw SQL usage detected');
      }

    } catch (error) {
      this.findings.high.push('❌ Unable to analyze database security');
    }
  }

  assessInputValidation() {
    console.log('🔍 Assessing Input Validation...');
    
    try {
      const routesContent = fs.readFileSync('server/routes.ts', 'utf8');
      const packageContent = fs.readFileSync('package.json', 'utf8');
      
      if (routesContent.includes('zod') || routesContent.includes('validator')) {
        this.strengths.push('✓ Input validation with Zod schemas');
      } else {
        this.findings.high.push('❌ Limited input validation detected');
      }

      if (packageContent.includes('express-validator')) {
        this.strengths.push('✓ Express validator for additional validation');
      }

      // Check for file upload security
      if (routesContent.includes('multer')) {
        if (routesContent.includes('fileFilter') || routesContent.includes('limits')) {
          this.strengths.push('✓ File upload restrictions implemented');
        } else {
          this.findings.high.push('❌ File upload security measures missing');
        }
      }

    } catch (error) {
      this.findings.medium.push('⚠️ Unable to analyze input validation');
    }
  }

  assessSecurityHeaders() {
    console.log('🔍 Assessing Security Headers...');
    
    try {
      const securityContent = fs.readFileSync('server/middleware/security.ts', 'utf8');
      
      if (securityContent.includes('X-Frame-Options')) {
        this.strengths.push('✓ X-Frame-Options header configured');
      } else {
        this.findings.medium.push('⚠️ X-Frame-Options header missing');
      }

      if (securityContent.includes('Content-Security-Policy')) {
        this.strengths.push('✓ Content Security Policy implemented');
      } else {
        this.findings.medium.push('⚠️ Content Security Policy missing');
      }

      if (securityContent.includes('X-XSS-Protection')) {
        this.strengths.push('✓ XSS protection headers configured');
      }

      if (securityContent.includes('rateLimitLogin')) {
        this.strengths.push('✓ Rate limiting on authentication endpoints');
      }

    } catch (error) {
      this.findings.medium.push('⚠️ Security headers configuration not found');
    }
  }

  assessSessionSecurity() {
    console.log('🔍 Assessing Session Security...');
    
    try {
      const indexContent = fs.readFileSync('server/index.ts', 'utf8');
      const sessionContent = fs.readFileSync('server/middleware/sessionSecurity.ts', 'utf8');
      
      if (indexContent.includes('httpOnly: true')) {
        this.strengths.push('✓ HTTP-only session cookies');
      } else {
        this.findings.high.push('❌ Session cookies not HTTP-only');
      }

      if (indexContent.includes('secure: true') || indexContent.includes('secure: false')) {
        this.findings.info.push('ℹ️ Session cookie security flag configured for environment');
      }

      if (sessionContent.includes('MAX_CONCURRENT_SESSIONS')) {
        this.strengths.push('✓ Concurrent session limits implemented');
      }

      if (indexContent.includes('IDLE_TIMEOUT')) {
        this.strengths.push('✓ Session idle timeout protection');
      }

      if (indexContent.includes('SESSION_DURATION')) {
        this.strengths.push('✓ Session duration limits configured');
      }

    } catch (error) {
      this.findings.medium.push('⚠️ Unable to analyze session security configuration');
    }
  }

  assessEnvironmentSecurity() {
    console.log('🔍 Assessing Environment Security...');
    
    // Check for .env file exposure
    try {
      if (fs.existsSync('.env')) {
        this.findings.critical.push('❌ .env file present in repository');
      } else {
        this.strengths.push('✓ No .env file in repository');
      }
    } catch (error) {
      // Ignore
    }

    // Check gitignore
    try {
      const gitignoreContent = fs.readFileSync('.gitignore', 'utf8');
      if (gitignoreContent.includes('.env') || gitignoreContent.includes('*.env')) {
        this.strengths.push('✓ Environment files excluded from version control');
      } else {
        this.findings.high.push('❌ Environment files not excluded from git');
      }
    } catch (error) {
      this.findings.medium.push('⚠️ .gitignore file not found');
    }

    // Check for hardcoded secrets
    try {
      const files = ['server/routes.ts', 'server/index.ts'];
      let hasHardcodedSecrets = false;
      
      files.forEach(file => {
        try {
          const content = fs.readFileSync(file, 'utf8');
          if (content.includes('sk-') || content.includes('key_') || content.includes('secret_')) {
            hasHardcodedSecrets = true;
          }
        } catch (e) {
          // File doesn't exist
        }
      });

      if (!hasHardcodedSecrets) {
        this.strengths.push('✓ No obvious hardcoded secrets detected');
      } else {
        this.findings.critical.push('❌ Potential hardcoded secrets detected');
      }
    } catch (error) {
      this.findings.medium.push('⚠️ Unable to scan for hardcoded secrets');
    }
  }

  assessDependencySecurity() {
    console.log('🔍 Assessing Dependency Security...');
    
    try {
      const packageContent = fs.readFileSync('package.json', 'utf8');
      const pkg = JSON.parse(packageContent);
      
      // Check for known vulnerable packages (basic check)
      const dependencies = { ...pkg.dependencies, ...pkg.devDependencies };
      
      if (dependencies['lodash'] && !dependencies['lodash'].includes('^4.17.21')) {
        this.findings.medium.push('⚠️ Potentially outdated lodash version');
      }

      if (dependencies['moment']) {
        this.findings.low.push('⚠️ Moment.js is deprecated, consider date-fns');
      }

      if (dependencies['express'] && dependencies['helmet']) {
        this.strengths.push('✓ Security middleware dependencies present');
      }

      this.findings.info.push(`ℹ️ Total dependencies: ${Object.keys(dependencies).length}`);

    } catch (error) {
      this.findings.medium.push('⚠️ Unable to analyze package dependencies');
    }
  }

  assessAPIEndpointSecurity() {
    console.log('🔍 Assessing API Endpoint Security...');
    
    try {
      const routesContent = fs.readFileSync('server/routes.ts', 'utf8');
      
      // Check for unprotected admin endpoints
      const adminEndpoints = routesContent.match(/app\.(get|post|put|delete)\(['"][^'"]*admin[^'"]*['"],?/g);
      if (adminEndpoints) {
        let unprotectedAdmin = 0;
        adminEndpoints.forEach(endpoint => {
          if (!endpoint.includes('requireAuth') && !endpoint.includes('isAuthenticated')) {
            unprotectedAdmin++;
          }
        });
        
        if (unprotectedAdmin > 0) {
          this.findings.critical.push(`❌ ${unprotectedAdmin} unprotected admin endpoints detected`);
        } else {
          this.strengths.push('✓ Admin endpoints properly protected');
        }
      }

      // Check for CORS configuration
      if (routesContent.includes('cors') || routesContent.includes('Access-Control')) {
        this.findings.info.push('ℹ️ CORS configuration detected');
      } else {
        this.findings.medium.push('⚠️ CORS configuration not found');
      }

    } catch (error) {
      this.findings.medium.push('⚠️ Unable to analyze API endpoints');
    }
  }

  calculateRiskScore() {
    const weights = {
      critical: 100,
      high: 50,
      medium: 20,
      low: 5
    };

    let totalRisk = 0;
    Object.keys(weights).forEach(severity => {
      totalRisk += this.findings[severity].length * weights[severity];
    });

    let securityLevel = 'Unknown';
    if (totalRisk === 0) securityLevel = 'Excellent';
    else if (totalRisk <= 50) securityLevel = 'Good';
    else if (totalRisk <= 150) securityLevel = 'Fair';
    else if (totalRisk <= 300) securityLevel = 'Poor';
    else securityLevel = 'Critical';

    return { totalRisk, securityLevel };
  }

  generateReport() {
    console.log('\n🛡️ SECURITY ASSESSMENT REPORT');
    console.log('=' .repeat(50));

    // Run all assessments
    this.assessAuthentication();
    this.assessDatabaseSecurity();
    this.assessInputValidation();
    this.assessSecurityHeaders();
    this.assessSessionSecurity();
    this.assessEnvironmentSecurity();
    this.assessDependencySecurity();
    this.assessAPIEndpointSecurity();

    const { totalRisk, securityLevel } = this.calculateRiskScore();

    console.log(`\n📊 OVERALL SECURITY LEVEL: ${securityLevel}`);
    console.log(`📈 Risk Score: ${totalRisk}`);

    console.log('\n✅ SECURITY STRENGTHS:');
    this.strengths.forEach(strength => console.log(`   ${strength}`));

    if (this.findings.critical.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES:');
      this.findings.critical.forEach(issue => console.log(`   ${issue}`));
    }

    if (this.findings.high.length > 0) {
      console.log('\n🔴 HIGH PRIORITY ISSUES:');
      this.findings.high.forEach(issue => console.log(`   ${issue}`));
    }

    if (this.findings.medium.length > 0) {
      console.log('\n🟡 MEDIUM PRIORITY ISSUES:');
      this.findings.medium.forEach(issue => console.log(`   ${issue}`));
    }

    if (this.findings.low.length > 0) {
      console.log('\n🔵 LOW PRIORITY ISSUES:');
      this.findings.low.forEach(issue => console.log(`   ${issue}`));
    }

    if (this.findings.info.length > 0) {
      console.log('\n💡 INFORMATIONAL:');
      this.findings.info.forEach(issue => console.log(`   ${issue}`));
    }

    console.log('\n🎯 RECOMMENDATIONS:');
    console.log('   1. Keep dependencies updated regularly');
    console.log('   2. Implement security monitoring and logging');
    console.log('   3. Regular penetration testing');
    console.log('   4. Security awareness training for developers');
    console.log('   5. Implement automated security scanning in CI/CD');

    return {
      securityLevel,
      totalRisk,
      findings: this.findings,
      strengths: this.strengths
    };
  }
}

// Run the assessment
const assessment = new SecurityAssessment();
const report = assessment.generateReport();

export { SecurityAssessment };