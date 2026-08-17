import prisma from "../../../../config/db.prisma";

import { deleteFiles } from "../../../../helpers/files/fileDelete";
import { filenameToUrl } from "../../../../helpers/files/utils/file-url.utils";

interface UpdateSiteSettingsPayload {
    logo?: string; // filename from multer
    favicon?: string; // filename from multer
    phones?: string[];
    emails?: string[];
    address?: string;
    workingHours?: string;
    mapEmbedUrl?: string;
}

const updateSiteSettings = async (payload: UpdateSiteSettingsPayload) => {
    const existing = await prisma.siteSettings.findFirst();

    // Replace old logo/favicon files on disk if new ones were uploaded
    if (payload.logo && existing?.logo) {
        deleteFiles([existing.logo]);
    }
    if (payload.favicon && existing?.favicon) {
        deleteFiles([existing.favicon]);
    }

    let settings;

    if (existing) {
        settings = await prisma.siteSettings.update({
            where: { id: existing.id },
            data: {
                ...(payload.logo && { logo: payload.logo }),
                ...(payload.favicon && { favicon: payload.favicon }),
                ...(payload.phones !== undefined && { phones: payload.phones }),
                ...(payload.emails !== undefined && { emails: payload.emails }),
                ...(payload.address !== undefined && { address: payload.address }),
                ...(payload.workingHours !== undefined && { workingHours: payload.workingHours }),
                ...(payload.mapEmbedUrl !== undefined && { mapEmbedUrl: payload.mapEmbedUrl }),
            },
        });
    } else {
        settings = await prisma.siteSettings.create({
            data: {
                logo: payload.logo ?? "",
                favicon: payload.favicon ?? "",
                phones: payload.phones ?? [],
                emails: payload.emails ?? [],
                address: payload.address ?? "",
                workingHours: payload.workingHours ?? "",
                mapEmbedUrl: payload.mapEmbedUrl ?? "",
            },
        });
    }

    return {
        ...settings,
        logo: settings.logo ? filenameToUrl(settings.logo) : "",
        favicon: settings.favicon ? filenameToUrl(settings.favicon) : "",
    };
};

const getSiteSettings = async () => {
    const settings = await prisma.siteSettings.findFirst();

    if (!settings) {
        // Return sane defaults instead of throwing, since the public site
        // (header/footer/contact page) should always render without an error
        // even before an admin has configured anything.
        return {
            id: null,
            logo: "",
            favicon: "",
            phones: [],
            emails: [],
            address: "",
            workingHours: "",
            mapEmbedUrl: "",
        };
    }

    return {
        ...settings,
        logo: settings.logo ? filenameToUrl(settings.logo) : "",
        favicon: settings.favicon ? filenameToUrl(settings.favicon) : "",
    };
};

export const SiteSettingsService = {
    updateSiteSettings,
    getSiteSettings,
};
