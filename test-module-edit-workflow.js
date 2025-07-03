/**
 * Test the complete module editing workflow with authenticated session
 */

const axios = require('axios');

async function testModuleEditWorkflow() {
  console.log('=== Module Edit Workflow Test ===\n');
  
  const baseURL = 'http://localhost:5000';
  
  // First, let's try to find modules that belong to the authenticated user
  try {
    console.log('1. Testing authentication and module access...');
    
    // Test with a session cookie (you'll need to get this from browser dev tools)
    const testCookie = 'connect.sid=s%3AyXXiEl8Q5Iz_8rPDGoGtIW_WFGW3KY7v.z2tUfZhP4hG8v9dxLjWFP6QhpQcXJdT9TQjsKhZwNlM';
    
    const response = await axios.get(`${baseURL}/api/modules`, {
      headers: {
        'Cookie': testCookie
      }
    });
    
    console.log(`✅ Successfully fetched modules. Found ${response.data.length} modules`);
    
    // Look for the "Welcome to Raising Arizona" module
    const welcomeModule = response.data.find(module => 
      module.title && module.title.includes('Welcome to Raising Arizona')
    );
    
    if (welcomeModule) {
      console.log(`✅ Found Welcome to Raising Arizona module:`, {
        id: welcomeModule.id,
        title: welcomeModule.title,
        creatorId: welcomeModule.creatorId || welcomeModule.creator_id,
        hasContent: !!welcomeModule.content,
        contentLength: welcomeModule.content ? welcomeModule.content.length : 0
      });
      
      // Test fetching this specific module
      console.log(`\n2. Testing individual module fetch for ID ${welcomeModule.id}...`);
      
      const moduleResponse = await axios.get(`${baseURL}/api/modules/${welcomeModule.id}`, {
        headers: {
          'Cookie': testCookie
        }
      });
      
      console.log(`✅ Successfully fetched individual module:`, {
        id: moduleResponse.data.id,
        title: moduleResponse.data.title,
        hasContent: !!moduleResponse.data.content,
        contentType: typeof moduleResponse.data.content,
        contentLength: moduleResponse.data.content ? moduleResponse.data.content.length : 0
      });
      
      // Test parsing the content structure
      if (moduleResponse.data.content) {
        console.log('\n3. Testing content structure parsing...');
        try {
          const content = typeof moduleResponse.data.content === 'string' 
            ? JSON.parse(moduleResponse.data.content) 
            : moduleResponse.data.content;
          
          console.log('Content structure:', {
            type: typeof content,
            isArray: Array.isArray(content),
            hasSections: content && content.sections ? content.sections.length : 0,
            keys: content && typeof content === 'object' ? Object.keys(content) : []
          });
          
          if (content && content.sections && Array.isArray(content.sections)) {
            console.log(`✅ Found ${content.sections.length} sections in content.sections`);
            content.sections.forEach((section, index) => {
              console.log(`  Section ${index + 1}: ${section.title || section.type || 'Unnamed'}`);
            });
          } else if (Array.isArray(content)) {
            console.log(`✅ Content is direct array with ${content.length} sections`);
            content.forEach((section, index) => {
              console.log(`  Section ${index + 1}: ${section.title || section.type || 'Unnamed'}`);
            });
          } else {
            console.log('❌ Content structure not recognized');
          }
          
        } catch (parseError) {
          console.log('❌ Error parsing content JSON:', parseError.message);
        }
      }
      
    } else {
      console.log('❌ No "Welcome to Raising Arizona" module found');
      console.log('Available modules:');
      response.data.slice(0, 5).forEach(module => {
        console.log(`  - ID: ${module.id}, Title: ${module.title}`);
      });
    }
    
  } catch (error) {
    if (error.response) {
      console.log(`❌ HTTP Error ${error.response.status}: ${error.response.data.message || error.response.data}`);
    } else if (error.request) {
      console.log('❌ Network Error: No response received');
    } else {
      console.log('❌ Error:', error.message);
    }
  }
  
  console.log('\n=== Workflow Summary ===');
  console.log('This test simulates:');
  console.log('1. User clicks "Edit" button on a module');
  console.log('2. Browser navigates to /comprehensive-module-creator?edit=MODULE_ID');
  console.log('3. React component parses URL parameter and sets edit mode');
  console.log('4. useQuery hook fetches module data from /api/modules/MODULE_ID');
  console.log('5. Module data is parsed and loaded into the form');
  console.log('\nIf this test passes but editing still fails, check:');
  console.log('- Browser console for React errors');
  console.log('- Network tab for failed API requests');
  console.log('- Component state management in React DevTools');
}

testModuleEditWorkflow();