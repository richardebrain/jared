/**
 * Avatar Seed Data
 * 
 * This script populates the database with initial avatar categories and items
 * for the avatar customization system.
 */
import { pool, db } from '../db.js';
import { avatarCategories, avatarItems } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';

/**
 * Seeds the database with avatar categories and items
 */
export async function seedAvatars() {
  try {
    console.log("Checking for existing avatar categories...");
    const existingCategories = await db.select().from(avatarCategories);
    
    if (existingCategories.length > 0) {
      console.log(`Found ${existingCategories.length} existing categories. Skipping category creation.`);
    } else {
      console.log("No categories found. Creating initial categories...");
      
      // Insert categories
      await db.insert(avatarCategories).values([
        { name: 'Head', displayOrder: 1, description: 'Face shape and skin tone' },
        { name: 'Hair', displayOrder: 2, description: 'Hairstyles and colors' },
        { name: 'Eyes', displayOrder: 3, description: 'Eye shapes and colors' },
        { name: 'Mouth', displayOrder: 4, description: 'Mouth and smile styles' },
        { name: 'Clothes', displayOrder: 5, description: 'Shirts, outfits, and uniform options' },
        { name: 'Accessories', displayOrder: 6, description: 'Glasses, hats, and other accessories' },
        { name: 'Background', displayOrder: 7, description: 'Avatar background colors and patterns' }
      ]);
      
      console.log("Categories created successfully!");
    }
    
    // Get the inserted categories to reference in items
    const categories = await db.select().from(avatarCategories);
    
    console.log("Checking for existing avatar items...");
    const existingItems = await db.select().from(avatarItems);
    
    if (existingItems.length > 0) {
      console.log(`Found ${existingItems.length} existing items. Skipping item creation.`);
    } else {
      console.log("No items found. Creating initial items...");
      
      // Create a mapping of category names to IDs for easier reference
      const categoryMap = {};
      categories.forEach(category => {
        categoryMap[category.name.toLowerCase()] = category.id;
      });
      
      // Insert basic avatar items
      await db.insert(avatarItems).values([
        // Head items
        {
          name: 'Round',
          categoryId: categoryMap['head'],
          price: 0, // Free default item
          isDefault: true,
          imagePath: '/avatars/head/round.svg',
          description: 'Basic round head shape'
        },
        
        // Hair items
        {
          name: 'Short',
          categoryId: categoryMap['hair'],
          price: 0, // Free default item
          isDefault: true,
          imagePath: '/avatars/hair/short.svg',
          description: 'Short neat hairstyle'
        },
        
        // Eyes items
        {
          name: 'Simple',
          categoryId: categoryMap['eyes'],
          price: 0, // Free default item
          isDefault: true,
          imagePath: '/avatars/eyes/simple.svg',
          description: 'Simple round eyes'
        },
        
        // Mouth items
        {
          name: 'Smile',
          categoryId: categoryMap['mouth'],
          price: 0, // Free default item
          isDefault: true,
          imagePath: '/avatars/mouth/smile.svg',
          description: 'Friendly smile'
        },
        
        // Clothes items
        {
          name: 'T-Shirt',
          categoryId: categoryMap['clothes'],
          price: 0, // Free default item
          isDefault: true,
          imagePath: '/avatars/clothes/tshirt.svg',
          description: 'Basic t-shirt'
        },
        
        // Background items
        {
          name: 'Plain',
          categoryId: categoryMap['background'],
          price: 0, // Free default item
          isDefault: true,
          imagePath: '/avatars/backgrounds/plain.svg',
          description: 'Plain background'
        },
        
        // Premium items (examples)
        {
          name: 'Teacher Outfit',
          categoryId: categoryMap['clothes'],
          price: 50,
          isDefault: false,
          imagePath: '/avatars/clothes/teacher.svg',
          description: 'Professional teacher outfit'
        },
        
        {
          name: 'Glasses',
          categoryId: categoryMap['accessories'],
          price: 30,
          isDefault: false,
          imagePath: '/avatars/accessories/glasses.svg',
          description: 'Stylish glasses'
        },
        
        {
          name: 'Classroom',
          categoryId: categoryMap['background'],
          price: 100,
          isDefault: false,
          imagePath: '/avatars/backgrounds/classroom.svg',
          description: 'Classroom background setting'
        }
      ]);
      
      console.log("Items created successfully!");
    }
    
    console.log("Avatar seed completed successfully!");
    return true;
  } catch (error) {
    console.error("Error seeding avatar data:", error);
    throw error;
  }
}

module.exports = { seedAvatars };