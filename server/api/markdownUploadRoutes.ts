import { Router } from 'express';
import { uploadToMemory, uploadFileToCloudinary } from '../services/cloudinary.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

/**
 * Upload image for markdown editor
 * This endpoint handles image uploads from the markdown editor and stores them in Cloudinary
 */
router.post('/upload-image', requireAuth, uploadToMemory.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No image file provided',
        message: 'Please select an image file to upload.' 
      });
    }

    const userId = req.session.userId as number;
    const folder = `mentor-me/modules/${userId}`; // Organize by user ID

    // Upload to Cloudinary
    const imageUrl = await uploadFileToCloudinary(req.file.buffer, folder);

    console.log(`Image uploaded to Cloudinary for user ${userId}: ${imageUrl}`);

    res.json({
      success: true,
      url: imageUrl,
      filename: req.file.originalname,
      size: req.file.size,
      message: 'Image uploaded successfully'
    });

  } catch (error) {
    console.error('Markdown image upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload image',
      message: 'There was an error uploading your image. Please try again.' 
    });
  }
});

/**
 * Upload multiple images for markdown editor
 * This endpoint handles multiple image uploads from the markdown editor
 */
router.post('/upload-images', requireAuth, uploadToMemory.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        error: 'No image files provided',
        message: 'Please select at least one image file to upload.' 
      });
    }

    const userId = req.session.userId as number;
    const folder = `mentor-me/modules/${userId}`;
    const uploadedImages = [];

    // Upload each image to Cloudinary
    for (const file of req.files as Express.Multer.File[]) {
      try {
        const imageUrl = await uploadFileToCloudinary(file.buffer, folder);
        uploadedImages.push({
          url: imageUrl,
          filename: file.originalname,
          size: file.size
        });
      } catch (uploadError) {
        console.error(`Failed to upload ${file.originalname}:`, uploadError);
        uploadedImages.push({
          error: `Failed to upload ${file.originalname}`,
          filename: file.originalname
        });
      }
    }

    console.log(`Uploaded ${uploadedImages.length} images to Cloudinary for user ${userId}`);

    res.json({
      success: true,
      images: uploadedImages,
      message: `Successfully uploaded ${uploadedImages.filter(img => !img.error).length} images`
    });

  } catch (error) {
    console.error('Markdown multiple image upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload images',
      message: 'There was an error uploading your images. Please try again.' 
    });
  }
});

/**
 * Delete image from Cloudinary
 * This endpoint allows users to delete uploaded images
 */
router.delete('/delete-image', requireAuth, async (req, res) => {
  try {
    const { imageUrl } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ 
        error: 'No image URL provided',
        message: 'Please provide the image URL to delete.' 
      });
    }

    // Extract public ID from Cloudinary URL
    const urlParts = imageUrl.split('/');
    const publicId = urlParts.slice(-2).join('/').split('.')[0]; // Remove file extension

    // Delete from Cloudinary
    const { v2: cloudinary } = await import('cloudinary');
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === 'ok') {
      res.json({
        success: true,
        message: 'Image deleted successfully'
      });
    } else {
      throw new Error('Failed to delete image from Cloudinary');
    }

  } catch (error) {
    console.error('Markdown image deletion error:', error);
    res.status(500).json({ 
      error: 'Failed to delete image',
      message: 'There was an error deleting your image. Please try again.' 
    });
  }
});

export default router; 