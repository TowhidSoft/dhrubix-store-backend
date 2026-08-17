import { Router } from "express";
import * as BrandController from "./brand.controller"
import validateRequest from "../../middleware/validateRequest";
// import { UserValidation } from "./user.validation";
import { Role } from "@prisma/client";
import Auth from "../../middleware/auth";
import upload from "../../../helpers/files/multer";
import { BrandValidation } from "./brand.validation";


const router = Router()


router.post("/", Auth(Role.ADMIN), upload.single("img"),
    validateRequest(BrandValidation.createBrandValidationSchema), BrandController.create)

router.patch("/:id", Auth(Role.ADMIN), upload.single("img"),
    validateRequest(BrandValidation.updateBrandValidationSchema), BrandController.updateBrand)

router.get("/", BrandController.getAll)
router.get("/:id", BrandController.getbrand)
router.delete("/:id", Auth(Role.ADMIN), BrandController.deleteBrand)

export const BrandRoutes = router;
