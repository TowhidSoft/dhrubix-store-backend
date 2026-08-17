import { Router } from "express";
import * as SizeController from "./size.controller"
import { Role } from "@prisma/client";
import Auth from "../../middleware/auth";
import validateRequest from "../../middleware/validateRequest";
import { SizeValidation } from "./size.validation";


const router = Router()


router.post("/", Auth(Role.ADMIN), validateRequest(SizeValidation.createSizeValidationSchema), SizeController.create)

router.patch("/:id", Auth(Role.ADMIN), validateRequest(SizeValidation.updateSizeValidationSchema), SizeController.update)

router.get("/", SizeController.getAll)
router.get("/:id", SizeController.getSize)
router.delete("/:id", Auth(Role.ADMIN), SizeController.deleteSize)

export const SizeRoutes = router;
