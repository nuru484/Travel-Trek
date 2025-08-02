// src/config/multer.ts
// This file configures Multer for handling file uploads in the application

import multer from 'multer';

const multerUpload = multer({
  storage: multer.memoryStorage(), // Directly setting the memoryStorage
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
});

export default multerUpload;
