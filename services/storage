// services/storageService.js
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: process.env.S3_REGION || 'auto',
  endpoint: process.env.S3_ENDPOINT, // R2 endpoint
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
  forcePathStyle: true, // necesario para compatibilidad con R2
});

const BUCKET = process.env.S3_BUCKET;
const PUBLIC_BASE_URL = process.env.S3_PUBLIC_BASE_URL;

/**
 * Sube una imagen al bucket R2 y devuelve { key, url }
 */
async function uploadImage(buffer, filename, mimetype) {
  const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const key = `bot-images/${uniqueName}-${filename}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
    })
  );

  const url = `${PUBLIC_BASE_URL}/${key}`;
  return { key, url };
}

/**
 * Elimina un objeto del bucket
 */
async function deleteImage(key) {
  if (!key) return;

  await s3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );
}

export {
  uploadImage,
  deleteImage,
};
