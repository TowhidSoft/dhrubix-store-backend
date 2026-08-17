import prisma from "../../../../config/db.prisma"
import { deleteFiles } from "../../../../helpers/files/fileDelete";
import httpStatus from "http-status"
import { urlToFilename } from "../../../../helpers/files/utils/file-url.utils";
import ApiError from "../../../../errors/apiError";

export const updateStory = async (
    payload?: {
        title?: string,
        subTitle?: string,
        image?: string | any
    }
) => {
    const existingStory = await prisma.ourStory.findFirst();

    if (payload.image && existingStory?.image) {
        deleteFiles([urlToFilename(existingStory.image)]);
    }

    let story;

    if (existingStory) {
        story = await prisma.ourStory.update({
            where: { id: existingStory.id },
            data: {
                ...(payload.title && { title: payload.title }),
                ...(payload.subTitle && { subTitle: payload.subTitle }),
                ...(payload.image && { image: payload.image }),
            },
        });
    } else {
        story = await prisma.ourStory.create({
            data: {
                title: payload.title ?? "",
                subTitle: payload.subTitle ?? "",
                image: payload.image ?? "",
            },
        });
    }
    return story;
};

export const getStory = async () => {
    const story = await prisma.ourStory.findFirst();
    if (!story) {
        throw new ApiError(httpStatus.NOT_FOUND, "Story not found!");
    }
    return story;
};

export const deleteStory = async () => {
    const story = await prisma.ourStory.findFirst();
    if (!story) {
        throw new ApiError(httpStatus.NOT_FOUND, "Story not found!");
    }
    if (story.image) {
        deleteFiles([story.image]);
    }
    await prisma.ourStory.deleteMany({});

    return story;
};

export const OurStoryService = {
    updateStory,
    getStory,
    deleteStory
}