import prisma from "../../../../config/db.prisma";
import ApiError from "../../../../errors/apiError";
import httpStatus from "http-status";

export const updateSocial = async (
    payload?: {
        pinterest?: string,
        linkedin?: string,
        instagram?: string,
        facebook?: string,
    }
) => {
    const existingSocial = await prisma.socials.findFirst();
    console.log(payload)
    let social;

    if (existingSocial) {
        social = await prisma.socials.update({
            where: { id: existingSocial.id },
            data: {
                ...(payload.pinterest && { pinterest: payload.pinterest }),
                ...(payload.linkedin && { linkedin: payload.linkedin }),
                ...(payload.instagram && { instagram: payload.instagram }),
                ...(payload.facebook && { facebook: payload.facebook }),
            },
        });
    } else {
        social = await prisma.socials.create({
            data: {
                pinterest: payload.pinterest ?? "",
                linkedin: payload.linkedin ?? "",
                instagram: payload.instagram ?? "",
                facebook: payload.facebook ?? "",
            },
        });
    }
    return social;
};

export const getSocial = async () => {
    const social = await prisma.socials.findFirst();
    if (!social) {
        throw new ApiError(httpStatus.NOT_FOUND, "No socials found!");
    }
    return social;
};


export const SocialService = {
    updateSocial,
    getSocial,
}