import { Router } from "express";
import * as WishListController from "./wishList.controller"
import validateRequest from "../../middleware/validateRequest";
import { Role } from "@prisma/client";
import Auth from "../../middleware/auth";
import { WishlistValidation } from "./wishList.validation";


const router = Router()

router.post("/", Auth(Role.CUSTOMER, Role.ADMIN), validateRequest(WishlistValidation.createWishlistValidationSchema), WishListController.create)

router.get("/", Auth(Role.CUSTOMER, Role.ADMIN), WishListController.getAll)

router.get("/:id", Auth(Role.CUSTOMER, Role.ADMIN), WishListController.get)

router.delete("/:id", Auth(Role.CUSTOMER, Role.ADMIN), WishListController.remove)

export const WishListRoutes = router;
