import { Router } from "express";
import * as SubscriberController from "./subscriber.controller"
import validateRequest from "../../middleware/validateRequest";
import { Role } from "@prisma/client";
import Auth from "../../middleware/auth";
import { subscriberValidationSchema } from "./subscriber.validation";


const router = Router()


router.post("/",
    validateRequest(subscriberValidationSchema), SubscriberController.create)
router.get("/", Auth(Role.ADMIN), SubscriberController.All)

// router.patch("/:id", Auth(Role.ADMIN), upload.single("img"),
//     validateRequest(BrandValidation.updateBrandValidationSchema), BrandController.updateBrand)

// router.get("/:id", BrandController.getbrand)
// router.delete("/:id", Auth(Role.ADMIN), BrandController.deleteBrand)

export const SubscriberRoutes = router;
