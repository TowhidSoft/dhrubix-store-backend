import { z } from "zod";

const updateSiteSettingsValidationSchema = z.object({
    phones: z.array(z.string()).optional(),
    emails: z.array(z.string().email("Invalid email address")).optional(),
    address: z.string().optional(),
    workingHours: z.string().optional(),
    mapEmbedUrl: z.string().optional(),
});

export const SiteSettingsValidation = {
    updateSiteSettingsValidationSchema,
};
