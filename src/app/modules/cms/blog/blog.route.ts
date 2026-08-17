import { Router } from "express";
import * as BlogController from "./blog.controller"
import { Role } from "@prisma/client";

import { BlogValidation } from "./blog.validation";
import upload from "../../../../helpers/files/multer";
import Auth from "../../../middleware/auth";
import validateRequest from "../../../middleware/validateRequest";


const router = Router()

const imageUpload = upload.fields([
    { name: "images", maxCount: 20 },
])

router.post("/", Auth(Role.ADMIN), imageUpload,
    validateRequest(BlogValidation.createBlogValidationSchema), BlogController.create)

router.patch("/:id", Auth(Role.ADMIN), imageUpload,
    validateRequest(BlogValidation.updateBlogValidationSchema), BlogController.update)

router.get("/", BlogController.getAll)

router.patch("/viewCount/:id", BlogController.updateViewCount)

router.get("/getAllByAdmin", Auth(Role.ADMIN), BlogController.getAllByAdmin)

router.get("/:id", BlogController.get)

router.delete("/:id", Auth(Role.ADMIN), BlogController.remove)

export const BlogRoutes = router;
