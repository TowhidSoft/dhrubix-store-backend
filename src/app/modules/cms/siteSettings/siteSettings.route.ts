import { Router } from "express";
import * as SiteSettingsController from "./siteSettings.controller";
import { Role } from "@prisma/client";
import Auth from "../../../middleware/auth";
import upload from "../../../../helpers/files/multer";
import validateRequest from "../../../middleware/validateRequest";
import { parseBodyData } from "../../../middleware/parseBodyData";
import { SiteSettingsValidation } from "./siteSettings.validation";

const router = Router();

const settingsUpload = upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "favicon", maxCount: 1 },
]);

router.post(
    "/",
    Auth(Role.ADMIN),
    settingsUpload,
    parseBodyData,
    validateRequest(SiteSettingsValidation.updateSiteSettingsValidationSchema),
    SiteSettingsController.updateSiteSettings
);

router.get("/", SiteSettingsController.getSiteSettings);

export const SiteSettingsRoutes = router;
