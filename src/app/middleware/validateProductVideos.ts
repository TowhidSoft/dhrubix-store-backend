import { Request, Response, NextFunction } from "express";
import httpStatus from "http-status";
import { deleteFiles } from "../../helpers/files/fileDelete";

const MAX_VIDEO_SIZE = 25 * 1024 * 1024; // 25 MB

// The shared multer instance has a 200MB global limit (for other file types),
// so we enforce the product-specific 25MB-per-video rule here instead.
export const validateProductVideos = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const videoFiles = req.files && (req.files as any)["videos"];

    if (videoFiles && Array.isArray(videoFiles) && videoFiles.length > 0) {
      const oversized = videoFiles.filter((file: any) => file.size > MAX_VIDEO_SIZE);

      if (oversized.length > 0) {
        // Clean up all uploaded video files from this request since the batch is rejected
        await deleteFiles(videoFiles.map((f: any) => f.filename));
        return res.status(httpStatus.BAD_REQUEST).json({
          status: false,
          message: "Each video must be 25MB or smaller.",
        });
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};
