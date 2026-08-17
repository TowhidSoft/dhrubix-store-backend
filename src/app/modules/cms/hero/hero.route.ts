import { Router } from "express";
import * as HeroController from "./hero.controller"
// import { UserValidation } from "./user.validation";
import { Role } from "@prisma/client";
import upload from "../../../../helpers/files/multer";
import { HeroValidation } from "./hero.validation";
import Auth from "../../../middleware/auth";
import validateRequest from "../../../middleware/validateRequest";


const router = Router()


router.post("/", Auth(Role.ADMIN), upload.single("image"),
    validateRequest(HeroValidation.updateHeroValidationSchema), HeroController.updateHero)

router.get("/", HeroController.getHero)
router.delete("/", Auth(Role.ADMIN), HeroController.deleteHero)

export const HeroRoutes = router;
