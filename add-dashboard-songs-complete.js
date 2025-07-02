/**
 * Script to add all dashboard audio player songs to the classroom music database
 */

const songs = [
  {
    title: 'Clean Up Time',
    artist: 'Raising Arizona Preschool',
    duration: 120,
    audioUrl: '/attached_assets/Clean Up Time.mp3',
    category: 'cleanup',
    description: 'Engaging song to make cleaning up fun and organized'
  },
  {
    title: 'Clean Up Time (Version 1)',
    artist: 'Raising Arizona Preschool',
    duration: 125,
    audioUrl: '/attached_assets/Clean Up Time (1).mp3',
    category: 'cleanup',
    description: 'Alternative version of the cleanup song'
  },
  {
    title: 'Clean Up Time (Version 2)',
    artist: 'Raising Arizona Preschool',
    duration: 118,
    audioUrl: '/attached_assets/Clean Up Time (2).mp3',
    category: 'cleanup',
    description: 'Another version of the cleanup song'
  },
  {
    title: 'Time to Change Activities',
    artist: 'Raising Arizona Preschool',
    duration: 90,
    audioUrl: '/attached_assets/Time to Change Activities.mp3',
    category: 'transitions',
    description: 'Smooth transition song to move between classroom activities'
  },
  {
    title: 'Time to Change Activities (Version 1)',
    artist: 'Raising Arizona Preschool',
    duration: 95,
    audioUrl: '/attached_assets/Time to Change Activities (1).mp3',
    category: 'transitions',
    description: 'Alternative version of the transition song'
  },
  {
    title: 'Time to Change Activities (Version 3)',
    artist: 'Raising Arizona Preschool',
    duration: 87,
    audioUrl: '/attached_assets/Time to Change Activities  version 3.mp3',
    category: 'transitions',
    description: 'Third version of the transition song'
  },
  {
    title: 'Time to Change Activities (Version 4)',
    artist: 'Raising Arizona Preschool',
    duration: 92,
    audioUrl: '/attached_assets/Time to Change Activities version 4.mp3',
    category: 'transitions',
    description: 'Fourth version of the transition song'
  },
  {
    title: 'Wash Up For Lunch',
    artist: 'Raising Arizona Preschool',
    duration: 75,
    audioUrl: '/attached_assets/Wash Up For Lunch.mp3',
    category: 'meals',
    description: 'Hand washing song for meal preparation time'
  },
  {
    title: 'Wash Up For Lunch (Version 1)',
    artist: 'Raising Arizona Preschool',
    duration: 78,
    audioUrl: '/attached_assets/Wash Up For Lunch (1).mp3',
    category: 'meals',
    description: 'Alternative version of the hand washing song'
  },
  {
    title: "I'm Closing My Eyes",
    artist: 'Raising Arizona Preschool',
    duration: 180,
    audioUrl: "/attached_assets/I'm Closing My Eyes.mp3",
    category: 'rest',
    description: 'Peaceful rest time song for naptime and quiet moments'
  },
  {
    title: "I'm Closing My Eyes (Version 1)",
    artist: 'Raising Arizona Preschool',
    duration: 175,
    audioUrl: "/attached_assets/I'm Closing My Eyes (1).mp3",
    category: 'rest',
    description: 'Alternative version of the rest time song'
  },
  {
    title: "I'm Closing My Eyes (Version 2)",
    artist: 'Raising Arizona Preschool',
    duration: 182,
    audioUrl: "/attached_assets/I'm Closing My Eyes (2).mp3",
    category: 'rest',
    description: 'Second alternative version of the rest time song'
  },
  {
    title: "I'm Closing My Eyes (Version 3)",
    artist: 'Raising Arizona Preschool',
    duration: 178,
    audioUrl: "/attached_assets/I'm Closing My Eyes (3).mp3",
    category: 'rest',
    description: 'Third alternative version of the rest time song'
  },
  {
    title: "Pass It Don't Hog It (Version 1)",
    artist: 'Raising Arizona Preschool',
    duration: 105,
    audioUrl: '/attached_assets/pass it dont hog it sharing song 1 (2).mp3',
    category: 'sharing',
    description: 'Fun song teaching children about sharing and taking turns'
  },
  {
    title: "Pass It Don't Hog It (Version 2)",
    artist: 'Raising Arizona Preschool',
    duration: 108,
    audioUrl: '/attached_assets/pass it dont hog it sharing version 2.mp3',
    category: 'sharing',
    description: 'Alternative version of the sharing song'
  },
  {
    title: 'Welcome Aboard',
    artist: 'Raising Arizona Preschool',
    duration: 85,
    audioUrl: '/attached_assets/Welcome Aboard.mp3',
    category: 'welcome',
    description: 'Welcoming song for new students and morning greetings'
  },
  {
    title: 'Welcome Aboard (Version 2)',
    artist: 'Raising Arizona Preschool',
    duration: 88,
    audioUrl: '/attached_assets/Welcome Aboard version 2.mp3',
    category: 'welcome',
    description: 'Alternative version of the welcome song'
  },
  {
    title: "Commitment's Whistle-Stop Rap",
    artist: 'Raising Arizona Preschool',
    duration: 140,
    audioUrl: "/attached_assets/_Commitment's Whistle-Stop Rap (Extended.mp3",
    category: 'core-values',
    description: 'Energetic rap about commitment and following through'
  },
  {
    title: 'Sunrise Paints the Glendale Sky Gold',
    artist: 'Raising Arizona Preschool',
    duration: 200,
    audioUrl: '/attached_assets/Sunrise paints the Glendale sky gold.mp3',
    category: 'core-values',
    description: 'Inspirational song celebrating new beginnings and community'
  }
];

async function addDashboardSongs() {
  try {
    console.log('Adding dashboard songs to classroom music database...');
    
    for (const song of songs) {
      const response = await fetch('http://localhost:5000/api/songs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'connect.sid=s%3AT1pAZFXZNgL-NwBprn2AHOtNzQl_w6gr.YXLfyOCLo2H5f5V8BqRZjhKKSlJ4OONsb%2B2x6AZJxwY'
        },
        body: JSON.stringify(song)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✓ Added: ${song.title}`);
      } else {
        console.log(`✗ Failed to add: ${song.title} - ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.log(`   Error details: ${errorText}`);
      }
    }
    
    console.log('\nDashboard songs integration complete!');
  } catch (error) {
    console.error('Error adding songs:', error);
  }
}

addDashboardSongs();