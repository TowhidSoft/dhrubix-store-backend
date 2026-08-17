import multer from "multer";
import path from "path";
import fs from "fs";
import httpStatus from "http-status"
import { Request, Response } from "express";

// Ensure uploads directory exists (create if missing, reuse if already exists)
const UPLOAD_DIR = "uploads/";
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

// Shared file filter
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|svg|pdf|doc|docx|xls|xlsx|mp4|mov|avi|mkv|webm|zip|json/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only image, PDF, Word, Excel, Zip and video files are allowed"));
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200 MB per file
  },
  fileFilter
});

// Email attachments upload instance (50MB limit for Nylas)
// export const emailUpload = multer({
//   storage,
//   limits: {
//     fileSize: 200 * 1024 * 1024, // 50 MB per file
//     files: 10, // Maximum 10 files
//   },
//   // fileFilter
// });

export const uploadLimitHandler = (err: any, _req: Request, res: Response, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ status: false, message: "File too large! Max size is 200 MB." });
    }
    return res.status(httpStatus.BAD_REQUEST).json({ status: false, message: err.message });
  } else if (err) {
    return res.status(httpStatus.BAD_REQUEST).json({ status: false, message: err.message });
  }
  next();
}

export default upload;
