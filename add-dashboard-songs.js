/**
 * Script to add all dashboard audio player songs to the classroom music database
 */

const songs = [
  {
    title: 'Clean Up Time',
    artist: 'Raising Arizona Preschool',
    duration: 120, // Approximate duration in seconds
    audioUrl: '/attached_assets/Clean Up Time.mp3',
    category: 'cleanup'
  },
  {
    title: 'Clean Up Time (Version 1)',
    artist: 'Raising Arizona Preschool',
    duration: 125,
    audioUrl: '/attached_assets/Clean Up Time (1).mp3',
    category: 'cleanup'
  },
  {
    title: 'Clean Up Time (Version 2)',
    artist: 'Raising Arizona Preschool',
    duration: 118,
    audioUrl: '/attached_assets/Clean Up Time (2).mp3',
    category: 'cleanup'
  },
  {
    title: 'Time to Change Activities',
    artist: 'Raising Arizona Preschool',
    duration: 90,
    audioUrl: '/attached_assets/Time to Change Activities.mp3',
    category: 'transitions'
  },
  {
    title: 'Time to Change Activities (Version 1)',
    artist: 'Raising Arizona Preschool',
    duration: 95,
    audioUrl: '/attached_assets/Time to Change Activities (1).mp3',
    category: 'transitions'
  },
  {
    title: 'Time to Change Activities (Version 3)',
    artist: 'Raising Arizona Preschool',
    duration: 87,
    audioUrl: '/attached_assets/Time to Change Activities  version 3.mp3',
    category: 'transitions'
  },
  {
    title: 'Time to Change Activities (Version 4)',
    artist: 'Raising Arizona Preschool',
    duration: 92,
    audioUrl: '/attached_assets/Time to Change Activities version 4.mp3',
    category: 'transitions'
  },
  {
    title: 'Wash Up For Lunch',
    artist: 'Raising Arizona Preschool',
    duration: 75,
    audioUrl: '/attached_assets/Wash Up For Lunch.mp3',
    category: 'meals'
  },
  {
    title: 'Wash Up For Lunch (Version 1)',
    artist: 'Raising Arizona Preschool',
    duration: 78,
    audioUrl: '/attached_assets/Wash Up For Lunch (1).mp3',
    category: 'meals'
  },
  {
    title: "I'm Closing My Eyes",
    artist: 'Raising Arizona Preschool',
    duration: 180,
    audioUrl: "/attached_assets/I'm Closing My Eyes.mp3",
    category: 'rest'
  },
  {
    title: "I'm Closing My Eyes (Version 1)",
    artist: 'Raising Arizona Preschool',
    duration: 175,
    audioUrl: "/attached_assets/I'm Closing My Eyes (1).mp3",
    category: 'rest'
  },
  {
    title: "I'm Closing My Eyes (Version 2)",
    artist: 'Raising Arizona Preschool',
    duration: 182,
    audioUrl: "/attached_assets/I'm Closing My Eyes (2).mp3",
    category: 'rest'
  },
  {
    title: "I'm Closing My Eyes (Version 3)",
    artist: 'Raising Arizona Preschool',
    duration: 178,
    audioUrl: "/attached_assets/I'm Closing My Eyes (3).mp3",
    category: 'rest'
  },
  {
    title: "Pass It Don't Hog It (Version 1)",
    artist: 'Raising Arizona Preschool',
    duration: 105,
    audioUrl: '/attached_assets/pass it dont hog it sharing song 1 (2).mp3',
    category: 'sharing'
  },
  {
    title: "Pass It Don't Hog It (Version 2)",
    artist: 'Raising Arizona Preschool',
    duration: 108,
    audioUrl: '/attached_assets/pass it dont hog it sharing version 2.mp3',
    category: 'sharing'
  },
  {
    title: 'Welcome Aboard',
    artist: 'Raising Arizona Preschool',
    duration: 85,
    audioUrl: '/attached_assets/Welcome Aboard.mp3',
    category: 'welcome'
  },
  {
    title: 'Welcome Aboard (Version 2)',
    artist: 'Raising Arizona Preschool',
    duration: 88,
    audioUrl: '/attached_assets/Welcome Aboard version 2.mp3',
    category: 'welcome'
  },
  {
    title: "Commitment's Whistle-Stop Rap",
    artist: 'Raising Arizona Preschool',
    duration: 140,
    audioUrl: "/attached_assets/_Commitment's Whistle-Stop Rap (Extended.mp3",
    category: 'core-values'
  },
  {
    title: 'Sunrise Paints the Glendale Sky Gold',
    artist: 'Raising Arizona Preschool',
    duration: 200,
    audioUrl: '/attached_assets/Sunrise paints the Glendale sky gold.mp3',
    category: 'core-values'
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
        },
        body: JSON.stringify(song)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✓ Added: ${song.title}`);
      } else {
        console.log(`✗ Failed to add: ${song.title} - ${response.statusText}`);
      }
    }
    
    console.log('\nDashboard songs integration complete!');
  } catch (error) {
    console.error('Error adding songs:', error);
  }
}

addDashboardSongs();