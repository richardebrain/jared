/**
 * Test to verify assessment points are being correctly calculated and displayed
 * for Laura Book (user ID 14) in the admin assessment results page
 */

const userId = 14; // Laura Book

async function testAssessmentPointsCalculation() {
  console.log('\n=== Assessment Points Verification Test ===\n');
  
  try {
    // Test the activity summary API directly
    const response = await fetch(`http://localhost:5000/api/admin/teachers/${userId}/activity-summary`, {
      headers: {
        'Cookie': 'connect.sid=s%3ASdJa3ff4AEXgqj1JG2cf_iGNbbc-LsvU.%2FSGgQjfbCq4UzN35YyepWzj5VLQY4nxTQlWgR5%2FNcC4'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const activityData = await response.json();
    
    console.log('🔍 Laura Book Activity Summary:');
    console.log('Points Breakdown:', activityData.pointsBreakdown);
    
    const { modulePoints, gamePoints, assessmentPoints, totalPoints } = activityData.pointsBreakdown;
    
    console.log('\n📊 Points Analysis:');
    console.log(`Module Points: ${modulePoints || 0}`);
    console.log(`Game Points: ${gamePoints || 0}`);
    console.log(`Assessment Points: ${assessmentPoints || 0}`);
    console.log(`Total Points: ${totalPoints || 0}`);
    
    const calculatedTotal = (modulePoints || 0) + (gamePoints || 0) + (assessmentPoints || 0);
    console.log(`Calculated Sum: ${calculatedTotal}`);
    console.log(`Difference: ${totalPoints - calculatedTotal}`);
    
    // Verify assessment history
    console.log('\n📝 Assessment History:');
    console.log(`Assessment Completions: ${activityData.assessmentHistory?.length || 0}`);
    
    if (activityData.assessmentHistory?.length > 0) {
      const passedAssessments = activityData.assessmentHistory.filter(a => a.status === 'Passed').length;
      console.log(`Passed Assessments: ${passedAssessments}`);
      console.log(`Failed Assessments: ${activityData.assessmentHistory.length - passedAssessments}`);
    }
    
    // Test to see if assessment points are showing correctly
    if (assessmentPoints > 0) {
      console.log('\n✅ SUCCESS: Assessment points are being calculated and returned');
      console.log(`Laura's assessment responses contributed ${assessmentPoints} points`);
    } else {
      console.log('\n❌ ISSUE: Assessment points showing as 0');
    }
    
    // Expected results based on previous analysis
    console.log('\n🎯 Expected Results:');
    console.log('- Assessment Points should be around 496 (from 40 assessment responses)');
    console.log('- Game Points should be around 16');
    console.log('- Module Points should be 0');
    console.log('- Total should be 694');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAssessmentPointsCalculation();