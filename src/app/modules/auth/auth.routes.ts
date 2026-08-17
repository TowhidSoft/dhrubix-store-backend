import { Router } from "express";
import * as AuthController from "./auth.controller"
import validateRequest from "../../middleware/validateRequest";
import { AuthValidation } from "./auth.validation";
import { refreshAccessToken } from "../../../helpers/utility/refreshToken";


const router = Router()


//User Authentication Routes
router.post("/register", validateRequest(AuthValidation.userRegisterSchema), AuthController.register)

router.post("/login", validateRequest(AuthValidation.userLoginSchema), AuthController.login)

router.post("/contactFormSubmit", validateRequest(AuthValidation.contactFormSubmitValidationSchema), AuthController.contactFormSubmit)


// // Forget Password Routes
router.post('/verifyEmail', AuthController.recoverVerifyEmail)
router.post('/verifyOTP', AuthController.recoverVerifyOTP)
router.post('/resetPass', AuthController.recoverResetPass)

router.post('/resendOtp', AuthController.resendOtp)
router.post('/refreshToken', refreshAccessToken)



export const AuthRoutes = router;
