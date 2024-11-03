import cloudinary from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadOnCloudinary = async (filePath) => {
  const result = await cloudinary.v2.uploader.upload(filePath);
  return { url: result.secure_url, public_id: result.public_id };
};

export const deletefromCloudinary = async (publicId) => {
  await cloudinary.v2.uploader.destroy(publicId);
};