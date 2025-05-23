/**
 * Avatar Seed Runner Script
 * 
 * This script runs the avatar seed process to populate the database
 * with initial avatar categories and items.
 */
import dotenv from 'dotenv';
import { seedAvatars } from '../server/seed/avatarSeed.js';

dotenv.config();

async function runAvatarSeed() {
  try {
    console.log("Starting avatar seed process...");
    await seedAvatars();
    console.log("Avatar seed completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error running avatar seed:", error);
    process.exit(1);
  }
}

// Run the seed process
runAvatarSeed();