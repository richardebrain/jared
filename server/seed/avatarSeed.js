/**
 * Avatar Seed Script
 * 
 * This script populates the avatar system with initial categories and items.
 * It creates the basic structure and default items that will be available to all users.
 */

const { db } = require('../db');
const { avatarCategories, avatarItems } = require('../../shared/schema');

async function seedAvatarCategories() {
  try {
    console.log("Seeding avatar categories...");
    
    // Check if categories already exist
    const existingCategories = await db.select().from(avatarCategories);
    if (existingCategories.length > 0) {
      console.log(`${existingCategories.length} avatar categories already exist, skipping insertion.`);
      return existingCategories;
    }
    
    // Base categories for avatar customization
    const categories = [
      { name: "Head Shape", displayOrder: 1, isLayerable: false },
      { name: "Hair", displayOrder: 2, isLayerable: true },
      { name: "Eyes", displayOrder: 3, isLayerable: true },
      { name: "Mouth", displayOrder: 4, isLayerable: false },
      { name: "Clothes", displayOrder: 5, isLayerable: true },
      { name: "Accessories", displayOrder: 6, isLayerable: true },
      { name: "Background", displayOrder: 7, isLayerable: false }
    ];
    
    const insertedCategories = await db.insert(avatarCategories).values(categories).returning();
    console.log(`Successfully inserted ${insertedCategories.length} avatar categories.`);
    
    return insertedCategories;
  } catch (error) {
    console.error("Error seeding avatar categories:", error);
    throw error;
  }
}

async function seedAvatarItems(categories) {
  try {
    console.log("Seeding avatar items...");
    
    // Check if items already exist
    const existingItems = await db.select().from(avatarItems);
    if (existingItems.length > 0) {
      console.log(`${existingItems.length} avatar items already exist, skipping insertion.`);
      return;
    }
    
    // Get category IDs
    const categoryMap = {};
    categories.forEach(category => {
      categoryMap[category.name] = category.id;
    });
    
    // Create default avatar items
    const items = [
      // Head Shapes
      {
        name: "Round",
        description: "A simple round head shape",
        categoryId: categoryMap["Head Shape"],
        svgPath: "/avatars/head/round.svg",
        pointsCost: 0,
        levelRequired: 1,
        rarity: "common",
        isDefault: true
      },
      {
        name: "Square",
        description: "A square head shape",
        categoryId: categoryMap["Head Shape"],
        svgPath: "/avatars/head/square.svg",
        pointsCost: 20,
        levelRequired: 1,
        rarity: "common",
        isDefault: false
      },
      {
        name: "Oval",
        description: "An oval head shape",
        categoryId: categoryMap["Head Shape"],
        svgPath: "/avatars/head/oval.svg",
        pointsCost: 30,
        levelRequired: 1,
        rarity: "common", 
        isDefault: false
      },
      
      // Hair Styles
      {
        name: "Short",
        description: "Short, simple hair",
        categoryId: categoryMap["Hair"],
        svgPath: "/avatars/hair/short.svg",
        pointsCost: 0,
        levelRequired: 1,
        rarity: "common",
        isDefault: true
      },
      {
        name: "Long",
        description: "Long, flowing hair",
        categoryId: categoryMap["Hair"],
        svgPath: "/avatars/hair/long.svg",
        pointsCost: 25,
        levelRequired: 1,
        rarity: "common",
        isDefault: false
      },
      {
        name: "Curly",
        description: "Curly, bouncy hair",
        categoryId: categoryMap["Hair"],
        svgPath: "/avatars/hair/curly.svg",
        pointsCost: 40,
        levelRequired: 2,
        rarity: "uncommon",
        isDefault: false
      },
      {
        name: "Teacher Bun",
        description: "The classic teacher hair bun",
        categoryId: categoryMap["Hair"],
        svgPath: "/avatars/hair/bun.svg",
        pointsCost: 75,
        levelRequired: 3,
        rarity: "rare",
        isDefault: false
      },
      
      // Eyes
      {
        name: "Simple",
        description: "Simple, round eyes",
        categoryId: categoryMap["Eyes"],
        svgPath: "/avatars/eyes/simple.svg",
        pointsCost: 0,
        levelRequired: 1,
        rarity: "common",
        isDefault: true
      },
      {
        name: "Happy",
        description: "Happy, smiling eyes",
        categoryId: categoryMap["Eyes"],
        svgPath: "/avatars/eyes/happy.svg",
        pointsCost: 15,
        levelRequired: 1,
        rarity: "common",
        isDefault: false
      },
      {
        name: "Glasses",
        description: "Eyes with glasses",
        categoryId: categoryMap["Eyes"],
        svgPath: "/avatars/eyes/glasses.svg",
        pointsCost: 50,
        levelRequired: 2,
        rarity: "uncommon",
        isDefault: false
      },
      {
        name: "Sunglasses",
        description: "Cool sunglasses",
        categoryId: categoryMap["Eyes"],
        svgPath: "/avatars/eyes/sunglasses.svg",
        pointsCost: 100,
        levelRequired: 4,
        rarity: "rare",
        isDefault: false
      },
      
      // Mouth
      {
        name: "Smile",
        description: "A friendly smile",
        categoryId: categoryMap["Mouth"],
        svgPath: "/avatars/mouth/smile.svg",
        pointsCost: 0,
        levelRequired: 1,
        rarity: "common",
        isDefault: true
      },
      {
        name: "Laugh",
        description: "A laughing mouth",
        categoryId: categoryMap["Mouth"],
        svgPath: "/avatars/mouth/laugh.svg",
        pointsCost: 20,
        levelRequired: 1,
        rarity: "common",
        isDefault: false
      },
      {
        name: "Thoughtful",
        description: "A thoughtful expression",
        categoryId: categoryMap["Mouth"],
        svgPath: "/avatars/mouth/thoughtful.svg",
        pointsCost: 35,
        levelRequired: 2,
        rarity: "uncommon",
        isDefault: false
      },
      
      // Clothes
      {
        name: "T-Shirt",
        description: "A casual t-shirt",
        categoryId: categoryMap["Clothes"],
        svgPath: "/avatars/clothes/tshirt.svg",
        pointsCost: 0,
        levelRequired: 1,
        rarity: "common",
        isDefault: true
      },
      {
        name: "Polo",
        description: "A professional polo shirt",
        categoryId: categoryMap["Clothes"],
        svgPath: "/avatars/clothes/polo.svg",
        pointsCost: 30,
        levelRequired: 1,
        rarity: "common",
        isDefault: false
      },
      {
        name: "Dress Shirt",
        description: "A formal dress shirt",
        categoryId: categoryMap["Clothes"],
        svgPath: "/avatars/clothes/dress-shirt.svg",
        pointsCost: 60,
        levelRequired: 2,
        rarity: "uncommon", 
        isDefault: false
      },
      {
        name: "Teacher Cardigan",
        description: "The quintessential teacher cardigan",
        categoryId: categoryMap["Clothes"],
        svgPath: "/avatars/clothes/cardigan.svg",
        pointsCost: 120,
        levelRequired: 5,
        rarity: "epic",
        isDefault: false
      },
      
      // Accessories
      {
        name: "None",
        description: "No accessories",
        categoryId: categoryMap["Accessories"],
        svgPath: "/avatars/accessories/none.svg",
        pointsCost: 0,
        levelRequired: 1,
        rarity: "common",
        isDefault: true
      },
      {
        name: "Necklace",
        description: "A simple necklace",
        categoryId: categoryMap["Accessories"],
        svgPath: "/avatars/accessories/necklace.svg",
        pointsCost: 45,
        levelRequired: 2,
        rarity: "uncommon",
        isDefault: false
      },
      {
        name: "Badge",
        description: "A professional ID badge",
        categoryId: categoryMap["Accessories"],
        svgPath: "/avatars/accessories/badge.svg",
        pointsCost: 65,
        levelRequired: 3,
        rarity: "rare",
        isDefault: false
      },
      {
        name: "Bow Tie",
        description: "A fancy bow tie",
        categoryId: categoryMap["Accessories"],
        svgPath: "/avatars/accessories/bowtie.svg",
        pointsCost: 80,
        levelRequired: 3,
        rarity: "rare",
        isDefault: false
      },
      {
        name: "Apple",
        description: "The classic teacher's apple",
        categoryId: categoryMap["Accessories"],
        svgPath: "/avatars/accessories/apple.svg",
        pointsCost: 150,
        levelRequired: 5,
        rarity: "legendary",
        isDefault: false
      },
      
      // Backgrounds
      {
        name: "Classroom",
        description: "A standard classroom background",
        categoryId: categoryMap["Background"],
        svgPath: "/avatars/backgrounds/classroom.svg",
        pointsCost: 0,
        levelRequired: 1,
        rarity: "common",
        isDefault: true
      },
      {
        name: "Library",
        description: "A cozy library background",
        categoryId: categoryMap["Background"],
        svgPath: "/avatars/backgrounds/library.svg",
        pointsCost: 55,
        levelRequired: 2,
        rarity: "uncommon",
        isDefault: false
      },
      {
        name: "Playground",
        description: "A colorful playground background",
        categoryId: categoryMap["Background"],
        svgPath: "/avatars/backgrounds/playground.svg",
        pointsCost: 85,
        levelRequired: 3,
        rarity: "rare",
        isDefault: false
      },
      {
        name: "Graduation",
        description: "A graduation ceremony background",
        categoryId: categoryMap["Background"],
        svgPath: "/avatars/backgrounds/graduation.svg",
        pointsCost: 200,
        levelRequired: 10,
        rarity: "legendary",
        isDefault: false
      }
    ];
    
    const insertedItems = await db.insert(avatarItems).values(items).returning();
    console.log(`Successfully inserted ${insertedItems.length} avatar items.`);
  } catch (error) {
    console.error("Error seeding avatar items:", error);
    throw error;
  }
}

async function createDefaultAvatars() {
  try {
    console.log("Creating default avatars for users without avatars...");
    
    // Get all users
    const users = await db.query.users.findMany();
    
    // Get default items for each category
    const defaultItems = await db.select()
      .from(avatarItems)
      .where({ isDefault: true });
    
    // Create a mapping of category to default item
    const defaultItemsByCategory = {};
    for (const item of defaultItems) {
      defaultItemsByCategory[item.categoryId] = item.id;
    }
    
    let createdCount = 0;
    
    // Check user avatars and create defaults if needed
    for (const user of users) {
      // Check if user already has an avatar
      const existingAvatars = await db.query.userAvatars.findMany({
        where: { userId: user.id }
      });
      
      if (existingAvatars.length === 0) {
        // Create a default avatar for this user
        const components = {};
        Object.entries(defaultItemsByCategory).forEach(([categoryId, itemId]) => {
          components[categoryId] = itemId;
        });
        
        await db.insert(userAvatars).values({
          userId: user.id,
          name: "My Avatar",
          isActive: true,
          components: components
        });
        
        // Grant the user the default items
        for (const itemId of Object.values(defaultItemsByCategory)) {
          await db.insert(userAvatarItems).values({
            userId: user.id,
            itemId: itemId
          });
        }
        
        createdCount++;
      }
    }
    
    console.log(`Created default avatars for ${createdCount} users.`);
  } catch (error) {
    console.error("Error creating default avatars:", error);
    throw error;
  }
}

async function seedAvatars() {
  try {
    const categories = await seedAvatarCategories();
    await seedAvatarItems(categories);
    await createDefaultAvatars();
    console.log("Avatar seed completed successfully!");
  } catch (error) {
    console.error("Avatar seed failed:", error);
  }
}

module.exports = { seedAvatars };