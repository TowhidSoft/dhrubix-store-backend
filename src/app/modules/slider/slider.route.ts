import { Router } from "express";
import * as SliderController from "./slider.controller";
import { Role } from "@prisma/client";
import Auth from "../../middleware/auth";
import upload from "../../../helpers/files/multer";

const router = Router();

router.post("/", Auth(Role.ADMIN), upload.single("image"), SliderController.create);

router.patch("/:id", Auth(Role.ADMIN), upload.single("image"), SliderController.update);

router.get("/", SliderController.getAll);

router.get("/getAllByAdmin", Auth(Role.ADMIN), SliderController.getAllByAdmin);

router.get("/:id", SliderController.get);

router.delete("/:id", Auth(Role.ADMIN), SliderController.remove);

export const SliderRoutes = router;
