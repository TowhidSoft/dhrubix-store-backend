import path from "path";
import fs from "fs/promises";

export const deleteFiles = async (files: string[]) => {
  for (const file of files) {
    try {
      const filePath = path.join(process.cwd(), "uploads", file);
      await fs.unlink(filePath);
      console.log("Deleted:", filePath);
    } catch (err: any) {
      if (err.code !== "ENOENT") {
        console.error("Error deleting file:", file, err.message);
      }
    }
  }
};