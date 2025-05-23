/**
 * Avatar Seed Runner
 * 
 * This script imports and runs the avatar seed function to populate
 * the database with initial avatar categories and items.
 */
const { seedAvatars } = require('./avatarSeed');

async function main() {
  try {
    console.log("Starting avatar seed process...");
    await seedAvatars();
    console.log("Avatar seed process completed!");
    process.exit(0);
  } catch (error) {
    console.error("Error running avatar seed:", error);
    process.exit(1);
  }
}

main();