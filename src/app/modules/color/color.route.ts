import { Router } from "express";
import * as ColorController from "./color.controller"
import { Role } from "@prisma/client";
import Auth from "../../middleware/auth";
import validateRequest from "../../middleware/validateRequest";
import { ColorValidation } from "./color.validation";


const router = Router()


router.post("/", Auth(Role.ADMIN), validateRequest(ColorValidation.createColorValidationSchema), ColorController.create)

router.patch("/:id", Auth(Role.ADMIN), validateRequest(ColorValidation.updateColorValidationSchema), ColorController.update)

router.get("/", ColorController.getAll)
router.get("/:id", ColorController.getColor)
router.delete("/:id", Auth(Role.ADMIN), ColorController.deleteColor)

export const ColorRoutes = router;
