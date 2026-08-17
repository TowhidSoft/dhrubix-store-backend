import { Router } from "express";
import * as SocialController from "./social.controller"
import { Role } from "@prisma/client";
import Auth from "../../middleware/auth";



const router = Router()


router.post("/", Auth(Role.ADMIN), SocialController.updateSocial)

router.get("/", SocialController.getSocial)

export const SocialRoutes = router;
