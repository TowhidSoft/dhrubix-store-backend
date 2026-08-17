import { Router } from "express";
import * as UserController from "./user.controller"
import validateRequest from "../../middleware/validateRequest";
// import { UserValidation } from "./user.validation";
import { Role } from "@prisma/client";
import Auth from "../../middleware/auth";
import { UserValidation } from "./user.validation";
import upload from "../../../helpers/files/multer";


const router = Router()


//User Routes
router.get("/", Auth(Role.CUSTOMER, Role.ADMIN), UserController.getProfile)
router.patch("/updateProfile", Auth(Role.CUSTOMER, Role.ADMIN), upload.single("photo"),
    validateRequest(UserValidation.updateProfileValidationSchema), UserController.updateProfile)
router.patch("/changePassword", Auth(Role.ADMIN, Role.CUSTOMER), validateRequest(UserValidation.changePasswordValidationSchema), UserController.changePassword)

router.get("/customerList", Auth(Role.ADMIN), UserController.userList)

export const UserRoutes = router;
