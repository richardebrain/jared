import express from "express";
import { storage } from "../storage";
import { insertAvatarItemSchema, insertUserAvatarSchema } from "@shared/schema";
import { z } from "zod";

const router = express.Router();

// Get all avatar categories
router.get("/categories", async (req, res) => {
  try {
    const categories = await storage.getAllAvatarCategories();
    res.json(categories);
  } catch (error) {
    console.error("Error fetching avatar categories:", error);
    res.status(500).json({ message: "Failed to fetch avatar categories" });
  }
});

// Get all avatar items
router.get("/items", isAuthenticated, async (req, res) => {
  try {
    const items = await storage.getAllAvatarItems();
    res.json(items);
  } catch (error) {
    console.error("Error fetching avatar items:", error);
    res.status(500).json({ message: "Failed to fetch avatar items" });
  }
});

// Get avatar items by category
router.get("/items/category/:categoryId", isAuthenticated, async (req, res) => {
  try {
    const categoryId = parseInt(req.params.categoryId);
    if (isNaN(categoryId)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }
    
    const items = await storage.getAvatarItemsByCategory(categoryId);
    res.json(items);
  } catch (error) {
    console.error("Error fetching avatar items by category:", error);
    res.status(500).json({ message: "Failed to fetch avatar items" });
  }
});

// Get user avatars
router.get("/user-avatars", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const avatars = await storage.getUserAvatars(userId);
    res.json(avatars);
  } catch (error) {
    console.error("Error fetching user avatars:", error);
    res.status(500).json({ message: "Failed to fetch user avatars" });
  }
});

// Get active user avatar
router.get("/user-avatars/active", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const avatar = await storage.getUserActiveAvatar(userId);
    
    if (!avatar) {
      return res.status(404).json({ message: "No active avatar found" });
    }
    
    res.json(avatar);
  } catch (error) {
    console.error("Error fetching active avatar:", error);
    res.status(500).json({ message: "Failed to fetch active avatar" });
  }
});

// Create a new user avatar
router.post("/user-avatars", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    const schema = insertUserAvatarSchema.extend({
      components: z.record(z.string(), z.number()),
    });
    
    const validatedData = schema.parse({
      ...req.body,
      userId
    });
    
    const avatar = await storage.createUserAvatar(validatedData);
    res.status(201).json(avatar);
  } catch (error) {
    console.error("Error creating user avatar:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to create avatar" });
  }
});

// Update a user avatar
router.put("/user-avatars/:id", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const avatarId = parseInt(req.params.id);
    
    if (isNaN(avatarId)) {
      return res.status(400).json({ message: "Invalid avatar ID" });
    }
    
    // Ensure the avatar belongs to the current user
    const userAvatars = await storage.getUserAvatars(userId);
    const avatarExists = userAvatars.some(avatar => avatar.id === avatarId);
    
    if (!avatarExists) {
      return res.status(403).json({ message: "You don't have permission to update this avatar" });
    }
    
    const schema = insertUserAvatarSchema.partial().extend({
      components: z.record(z.string(), z.number()).optional(),
    });
    
    const validatedData = schema.parse(req.body);
    const avatar = await storage.updateUserAvatar(avatarId, validatedData);
    
    res.json(avatar);
  } catch (error) {
    console.error("Error updating user avatar:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to update avatar" });
  }
});

// Set active avatar
router.post("/user-avatars/:id/set-active", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const avatarId = parseInt(req.params.id);
    
    if (isNaN(avatarId)) {
      return res.status(400).json({ message: "Invalid avatar ID" });
    }
    
    // Ensure the avatar belongs to the current user
    const userAvatars = await storage.getUserAvatars(userId);
    const avatarExists = userAvatars.some(avatar => avatar.id === avatarId);
    
    if (!avatarExists) {
      return res.status(403).json({ message: "You don't have permission to update this avatar" });
    }
    
    const success = await storage.setActiveAvatar(userId, avatarId);
    
    if (success) {
      res.json({ message: "Avatar set as active" });
    } else {
      res.status(500).json({ message: "Failed to set avatar as active" });
    }
  } catch (error) {
    console.error("Error setting active avatar:", error);
    res.status(500).json({ message: "Failed to set avatar as active" });
  }
});

// Get user avatar items (purchased items)
router.get("/user-avatar-items", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const items = await storage.getUserAvatarItems(userId);
    res.json(items);
  } catch (error) {
    console.error("Error fetching user avatar items:", error);
    res.status(500).json({ message: "Failed to fetch user avatar items" });
  }
});

// Purchase an avatar item
router.post("/purchase/:itemId", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const itemId = parseInt(req.params.itemId);
    
    if (isNaN(itemId)) {
      return res.status(400).json({ message: "Invalid item ID" });
    }
    
    try {
      const userItem = await storage.purchaseAvatarItem(userId, itemId);
      res.status(201).json(userItem);
    } catch (error) {
      if (error.message === "Not enough points to purchase this item") {
        return res.status(400).json({ message: error.message });
      }
      throw error;
    }
  } catch (error) {
    console.error("Error purchasing avatar item:", error);
    res.status(500).json({ message: "Failed to purchase item" });
  }
});

// Check if user owns an avatar item
router.get("/owns-item/:itemId", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const itemId = parseInt(req.params.itemId);
    
    if (isNaN(itemId)) {
      return res.status(400).json({ message: "Invalid item ID" });
    }
    
    const ownsItem = await storage.checkUserOwnsAvatarItem(userId, itemId);
    res.json({ ownsItem });
  } catch (error) {
    console.error("Error checking item ownership:", error);
    res.status(500).json({ message: "Failed to check item ownership" });
  }
});

// Create new avatar category (admin only)
router.post("/categories", isAuthenticated, async (req: any, res) => {
  try {
    if (!req.user.isAdmin && !req.user.isOwner) {
      return res.status(403).json({ message: "You don't have permission to create avatar categories" });
    }
    
    const category = await storage.createAvatarCategory(req.body);
    res.status(201).json(category);
  } catch (error) {
    console.error("Error creating avatar category:", error);
    res.status(500).json({ message: "Failed to create category" });
  }
});

// Create new avatar item (admin only)
router.post("/items", isAuthenticated, async (req: any, res) => {
  try {
    if (!req.user.isAdmin && !req.user.isOwner) {
      return res.status(403).json({ message: "You don't have permission to create avatar items" });
    }
    
    const schema = insertAvatarItemSchema;
    const validatedData = schema.parse(req.body);
    
    const item = await storage.createAvatarItem(validatedData);
    res.status(201).json(item);
  } catch (error) {
    console.error("Error creating avatar item:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to create item" });
  }
});

export default router;