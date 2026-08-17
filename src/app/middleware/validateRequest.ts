import { NextFunction, Request, Response } from "express";
import { ZodObject, ZodTypeAny } from "zod";

const validateRequest =
	(schema: ZodObject | ZodTypeAny) =>
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			try {
				await schema.safeParse(req.body);
				return next();
			} catch (error) {
				next(error);
			}
		};

export default validateRequest;
