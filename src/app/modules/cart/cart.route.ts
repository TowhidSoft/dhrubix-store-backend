import { Router } from "express";
import * as CartListController from "./cart.controller"
import validateRequest from "../../middleware/validateRequest";
import { Role } from "@prisma/client";
import Auth from "../../middleware/auth";
import { CartValidation } from "./cart.validation";


const router = Router()

router.post("/", Auth(Role.CUSTOMER, Role.ADMIN), validateRequest(CartValidation.createCartValidationSchema), CartListController.create)

router.get("/", Auth(Role.CUSTOMER, Role.ADMIN), CartListController.getAll)

router.get("/:id", Auth(Role.CUSTOMER, Role.ADMIN), CartListController.get)
router.patch("/:id", Auth(Role.CUSTOMER, Role.ADMIN), validateRequest(CartValidation.updateCartValidationSchema), CartListController.update)

router.delete("/:id", Auth(Role.ADMIN, Role.CUSTOMER), CartListController.remove)

export const CartRoutes = router;
