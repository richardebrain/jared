/**
 * Test ActivityBuilder with real AI-generated content to verify proper data display
 */

async function testRealActivityContent() {
  console.log('=== TESTING REAL AI-GENERATED ACTIVITY CONTENT ===\n');

  try {
    // Test with the exact scenario from user's screenshot
    const response = await fetch('http://localhost:5000/api/ai/generate-content-blocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: 'Managing students during break',
        sectionTitle: 'Guided Activity (step-by-step)',
        moduleTitle: 'Managing students during break', 
        sectionType: 'activity'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('AI Response received:');
    console.log(`- Blocks: ${data.blocks?.length || 0}`);
    
    if (data.blocks && data.blocks.length > 0) {
      data.blocks.forEach((block, index) => {
        console.log(`\nBlock ${index + 1}:`);
        console.log(`  Type: ${block.type}`);
        console.log(`  Preview: ${block.preview}`);
        
        if (typeof block.content === 'object') {
          console.log('  ✓ Content is structured object:');
          console.log(`    Title: ${block.content.title || 'N/A'}`);
          console.log(`    Activity Type: ${block.content.activityType || 'N/A'}`);
          console.log(`    Instructions: ${block.content.instructions?.substring(0, 100) || 'N/A'}...`);
          console.log(`    Prompt Items: ${JSON.stringify(block.content.promptItems || [])}`);
          console.log(`    Answer Key: ${JSON.stringify(block.content.answerKey || [])}`);
          console.log(`    UI Hints: ${block.content.uiHints || 'N/A'}`);
          console.log(`    Estimated Time: ${block.content.estimatedTime || 'N/A'} minutes`);
        } else {
          console.log(`  Content type: ${typeof block.content}`);
          console.log(`  Content preview: ${String(block.content).substring(0, 100)}...`);
        }
      });

      // Test ActivityBuilder data parsing with real AI response
      console.log('\n--- Testing ActivityBuilder Parsing Logic ---');
      
      const mockActivities = data.blocks.map((block, index) => {
        let activityData = {
          title: 'New Activity',
          activityType: 'Drag-and-Match',
          instructions: '',
          promptItems: ['New item 1', 'New item 2', 'New item 3'],
          answerKey: ['Answer 1', 'Answer 2', 'Answer 3'],
          uiHints: 'Use interactive cards with drag-and-drop functionality',
          estimatedTime: 5
        };

        // Extract title from preview or block title
        if (block.preview) {
          activityData.title = block.preview;
        } else if (block.title) {
          activityData.title = block.title;
        }

        // Parse content - handle both string and object formats
        if (typeof block.content === 'object' && block.content !== null) {
          // Use structured content object
          activityData.title = block.content.title || activityData.title;
          activityData.activityType = block.content.activityType || activityData.activityType;
          activityData.instructions = block.content.instructions || block.content.description || '';
          activityData.promptItems = Array.isArray(block.content.promptItems) 
            ? block.content.promptItems 
            : Array.isArray(block.content.items) 
              ? block.content.items 
              : activityData.promptItems;
          activityData.answerKey = Array.isArray(block.content.answerKey) 
            ? block.content.answerKey 
            : activityData.answerKey;
          activityData.uiHints = block.content.uiHints || activityData.uiHints;
          activityData.estimatedTime = block.content.estimatedTime || activityData.estimatedTime;
        } else if (typeof block.content === 'string') {
          // Parse text content to extract activity details
          activityData.instructions = block.content;
          
          // Try to extract items from content text
          const lines = block.content.split('\n').filter(line => line.trim());
          const itemLines = lines.filter(line => 
            line.includes('•') || line.includes('-') || line.includes('1.') || line.includes('2.')
          );
          
          if (itemLines.length > 0) {
            activityData.promptItems = itemLines.map(line => 
              line.replace(/^[\s\-\•\d\.\)]+/, '').trim()
            ).filter(item => item.length > 0);
          }
        }

        return {
          id: `activity-${Date.now()}-${index}`,
          title: activityData.title,
          activityType: activityData.activityType,
          instructions: activityData.instructions,
          promptItems: activityData.promptItems,
          answerKey: activityData.answerKey,
          uiHints: activityData.uiHints,
          estimatedTime: activityData.estimatedTime
        };
      });

      console.log('\nParsed Activities for ActivityBuilder:');
      mockActivities.forEach((activity, index) => {
        console.log(`\nActivity ${index + 1}:`);
        console.log(`  Title: "${activity.title}"`);
        console.log(`  Type: ${activity.activityType}`);
        console.log(`  Instructions: "${activity.instructions.substring(0, 100)}..."`);
        console.log(`  Items: [${activity.promptItems.map(item => `"${item}"`).join(', ')}]`);
        console.log(`  Answers: [${activity.answerKey.map(ans => `"${ans}"`).join(', ')}]`);
        console.log(`  UI Hints: "${activity.uiHints}"`);
        console.log(`  Time: ${activity.estimatedTime} minutes`);
        
        // Check if we're still showing placeholder data
        const hasPlaceholderData = activity.promptItems.some(item => 
          item.includes('Item 1') || item.includes('Item 2') || item.includes('New item')
        );
        
        if (hasPlaceholderData) {
          console.log(`  ⚠️  WARNING: Still showing placeholder data instead of real content`);
        } else {
          console.log(`  ✅ SUCCESS: Showing real AI-generated content`);
        }
      });

    } else {
      console.log('No blocks received from AI');
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the test
testRealActivityContent().then(() => {
  console.log('\n=== TEST COMPLETE ===');
  console.log('If activities still show placeholder data (Item 1, Item 2, etc.),');
  console.log('the ActivityBuilder needs further content parsing improvements.');
  console.log('If activities show real content, the fix was successful.');
});