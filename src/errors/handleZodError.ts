import z, { ZodError } from "zod";
import { IGenericErrorMessage } from "../interfaces/error";
import { IGenericErrorResponse } from "../interfaces/common";

const handleZodError = (error: ZodError): IGenericErrorResponse => {
    const errors: IGenericErrorMessage[] = error.issues.map(
        (issue: z.core.$ZodIssue) => {
            return {
                path: issue?.path[issue.path.length - 1] as string | number,
                message: issue?.message,
            };
        },
    );

    const statusCode = 400;

    return {
        statusCode,
        message: "Validation Error",
        errorMessages: errors,
    };
};

export default handleZodError;
