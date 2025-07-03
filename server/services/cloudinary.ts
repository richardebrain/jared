import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { Readable } from 'stream';

// Configure Cloudinary with environment variables
// Note: Current environment variables appear to be swapped, using correct mapping
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_API_KEY, // Currently contains "dozigrsno"
  api_key: process.env.CLOUDINARY_API_SECRET, // Currently contains "647633784352131"
  api_secret: process.env.CLOUDINARY_CLOUD_NAME, // Currently contains "ZkWfX2H1ynEOXoNmBMPWev5IPCQ"
  secure: true
});


/**
 * Uploads a file (image, audio, or video) to Cloudinary.
 * @param {Buffer | string} file - The file buffer or local file path.
 * @param {string} [folder] - Optional folder in Cloudinary.
 * @returns {Promise<string>} - The URL of the uploaded file.
 */
export async function uploadFileToCloudinary(file: Buffer | string, folder?: string): Promise<string> {
  try {
    let uploadResult;
    if (Buffer.isBuffer(file)) {
      // Upload from buffer
      uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder, resource_type: 'auto' },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        Readable.from(file).pipe(uploadStream);
      });
    } else {
      // Upload from file path
      uploadResult = await cloudinary.uploader.upload(file, { folder, resource_type: 'auto' });
    }
    console.log(uploadResult,'result from cloudinary')
    // @ts-ignore
    return uploadResult.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload file to Cloudinary');
  }
} 




const allowedTypes = [
  "image/jpeg", "image/png", "image/svg+xml",
  "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav",
  "video/mp4", "video/quicktime", "video/x-matroska"
];
export const uploadToMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB, adjust as needed
  fileFilter: (req, file, cb) => {
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only images, audio, and video files are allowed"));
    }
    cb(null, true);
  },
});