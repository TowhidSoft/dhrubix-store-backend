import { Router } from "express";
import { Role } from "@prisma/client";
import Auth from "../../middleware/auth";
import * as DashboardController from "./dashboard.controller"
const router = Router()

router.get("/stats", Auth(Role.ADMIN), DashboardController.DashboardStats)
router.get("/recent", Auth(Role.ADMIN), DashboardController.RecentActivity)
router.get("/orders-chart", Auth(Role.ADMIN), DashboardController.OrdersChart)
router.get("/recent-orders", Auth(Role.ADMIN), DashboardController.RecentOrders)

export const DashboardRoutes = router;