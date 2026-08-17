import prisma from "../../../../config/db.prisma";
import ApiError from "../../../../errors/apiError";
import httpStatus from "http-status";
import { deleteFiles } from "../../../../helpers/files/fileDelete";
import { urlToFilename } from "../../../../helpers/files/utils/file-url.utils";

export const updateHero = async (
    payload?: {
        title?: string,
        subTitle?: string,
        intro?: string,
        image?: string | any
    }
) => {
    const existingHero = await prisma.hero.findFirst();

    if (payload.image && existingHero?.image) {
        deleteFiles([urlToFilename(existingHero.image)]);
    }

    let hero;

    if (existingHero) {
        hero = await prisma.hero.update({
            where: { id: existingHero.id },
            data: {
                ...(payload.title && { title: payload.title }),
                ...(payload.subTitle && { subTitle: payload.subTitle }),
                ...(payload.intro && { intro: payload.intro }),
                ...(payload.image && { image: payload.image }),
            },
        });
    } else {
        hero = await prisma.hero.create({
            data: {
                title: payload.title ?? "",
                subTitle: payload.subTitle ?? "",
                intro: payload.intro ?? "",
                image: payload.image ?? "",
            },
        });
    }
    return hero;
};

export const getHero = async () => {
    const hero = await prisma.hero.findFirst();
    if (!hero) {
        throw new ApiError(httpStatus.NOT_FOUND, "Hero not found!");
    }
    return hero;
};

export const deleteHero = async () => {
    const hero = await prisma.hero.findFirst();
    if (!hero) {
        throw new ApiError(httpStatus.NOT_FOUND, "Hero not found!");
    }
    if (hero.image) {
        deleteFiles([hero.image]);
    }
    await prisma.hero.deleteMany({});

    return hero;
};

export const HeroService = {
    updateHero,
    getHero,
    deleteHero
}