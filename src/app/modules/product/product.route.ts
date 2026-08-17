import { Router } from "express";
import * as ProductController from "./product.controller"
import validateRequest from "../../middleware/validateRequest";
import { Role } from "@prisma/client";
import Auth from "../../middleware/auth";
import upload, { uploadLimitHandler } from "../../../helpers/files/multer";
import { validateProductVideos } from "../../middleware/validateProductVideos";
import { ProductValidation } from "./product.validation";
import { parseBodyData } from "../../middleware/parseBodyData";


const router = Router()

const imageUpload = upload.fields([
    { name: "images", maxCount: 20 },
    { name: "videos", maxCount: 3 },
])

router.post("/", Auth(Role.ADMIN), imageUpload, uploadLimitHandler, validateProductVideos, parseBodyData,
    validateRequest(ProductValidation.createProductValidationSchema), ProductController.create)

router.patch("/:id", Auth(Role.ADMIN), imageUpload, uploadLimitHandler, validateProductVideos, parseBodyData,
    validateRequest(ProductValidation.updateProductValidationSchema), ProductController.update)

router.get("/", ProductController.getAll)

router.get("/best-sell", ProductController.getBestSell)
router.get("/on-sale", ProductController.getOnSale)
router.get("/top-rated", ProductController.getTopRated)

router.get("/getAllByAdmin", Auth(Role.ADMIN), ProductController.getAllByAdmin)

router.get("/:id", ProductController.get)

router.delete("/:id", Auth(Role.ADMIN), ProductController.remove)

export const ProductRoutes = router;
