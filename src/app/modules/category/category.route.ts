import { Router } from "express";
import * as CategoryController from "./category.controller"
import validateRequest from "../../middleware/validateRequest";
// import { UserValidation } from "./user.validation";
import { Role } from "@prisma/client";
import Auth from "../../middleware/auth";
import upload from "../../../helpers/files/multer";
import { CategoryValidation } from "./category.validation";


const router = Router()


router.post("/", Auth(Role.ADMIN), upload.single("img"),
    validateRequest(CategoryValidation.createCategoryValidationSchema), CategoryController.create)

router.patch("/:id", Auth(Role.ADMIN), upload.single("img"),
    validateRequest(CategoryValidation.updateCategoryValidationSchema), CategoryController.updateCategory)

router.get("/", CategoryController.getAll)
router.get("/:id", CategoryController.getCategory)
router.delete("/:id", Auth(Role.ADMIN), CategoryController.deleteCategory)

export const CategoryRoutes = router;
