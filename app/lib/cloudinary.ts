import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a raw buffer directly to Cloudinary using their v2 uploader stream API
 * @param buffer - File data buffer
 * @param folder - Folder path inside Cloudinary
 * @returns Secure URL of the uploaded image
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string = "holy-streaks"
): Promise<string> {
  if (!process.env.CLOUDINARY_API_SECRET) {
    throw new Error("Por favor, preencha o campo CLOUDINARY_API_SECRET no seu arquivo .env.");
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve(result.secure_url);
        } else {
          reject(new Error("Erro desconhecido durante o upload para o Cloudinary."));
        }
      }
    );

    uploadStream.end(buffer);
  });
}
