import { Router } from "express";
import * as SubCategoryController from "./subcategory.controller"
import validateRequest from "../../../middleware/validateRequest";
import { Role } from "@prisma/client";
import Auth from "../../../middleware/auth";
import upload from "../../../../helpers/files/multer";
import { SubcategoryValidation } from "./subcategory.validation";


const router = Router()


router.post("/", Auth(Role.ADMIN), upload.single("img"),
    validateRequest(SubcategoryValidation.createSubcategoryValidationSchema), SubCategoryController.create)

router.patch("/:id", Auth(Role.ADMIN), upload.single("img"),
    validateRequest(SubcategoryValidation.updateSubcategoryValidationSchema), SubCategoryController.updateSubCategory)

router.get("/", SubCategoryController.getAll)
router.get("/category/:id", SubCategoryController.getAllByCategory)
router.get("/:id", SubCategoryController.getSubCategory)
router.delete("/:id", Auth(Role.ADMIN), SubCategoryController.deleteSubCategory)

export const SubCategoryRoutes = router;
