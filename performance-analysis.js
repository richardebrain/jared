/**
 * Performance Analysis Script
 * Identifies bottlenecks and optimization opportunities
 */

async function testEndpointPerformance() {
  const endpoints = [
    '/api/schools',
    '/api/auth/me',
    '/api/admin/session-stats',
    '/api/modules',
    '/api/assessment/domains'
  ];

  console.log('🔍 Testing endpoint performance...\n');

  for (const endpoint of endpoints) {
    try {
      const start = Date.now();
      const response = await fetch(`http://localhost:5000${endpoint}`);
      const end = Date.now();
      const duration = end - start;
      
      const status = response.status === 401 ? '401 (expected)' : response.status;
      const performance = duration < 1000 ? '🟢 Fast' : 
                         duration < 3000 ? '🟡 Slow' : '🔴 Very Slow';
      
      console.log(`${performance} ${endpoint}: ${duration}ms (${status})`);
    } catch (error) {
      console.log(`❌ ${endpoint}: Error - ${error.message}`);
    }
  }
}

async function checkDatabaseConnections() {
  console.log('\n📊 Checking database performance...');
  
  try {
    const start = Date.now();
    const response = await fetch('http://localhost:5000/api/schools');
    const end = Date.now();
    
    if (response.ok) {
      const data = await response.json();
      console.log(`Database query completed in ${end - start}ms`);
      console.log(`Returned ${data.length || 0} records`);
    }
  } catch (error) {
    console.log(`Database connection error: ${error.message}`);
  }
}

async function runPerformanceAnalysis() {
  console.log('⚡ ECE Platform Performance Analysis');
  console.log('=====================================\n');
  
  await testEndpointPerformance();
  await checkDatabaseConnections();
  
  console.log('\n💡 Performance Recommendations:');
  console.log('• Database queries taking >4 seconds suggest connection pooling issues');
  console.log('• First request after startup is slower due to database connection initialization');
  console.log('• Consider implementing query result caching for frequently accessed data');
  console.log('• Monitor concurrent session management overhead');
}

runPerformanceAnalysis().catch(console.error);