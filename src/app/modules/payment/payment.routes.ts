import { Router } from "express";
import * as PaymentController from './payment.controller'
import Auth from "../../middleware/auth";
import { Role } from "@prisma/client";
const router = Router();


router.get("/history", Auth(Role.CUSTOMER, Role.ADMIN), PaymentController.history);
router.get("/adminHistory", Auth(Role.ADMIN), PaymentController.adminHistory);
router.get("/:id", Auth(Role.ADMIN), PaymentController.detais);



export const PaymentRoutes = router;
