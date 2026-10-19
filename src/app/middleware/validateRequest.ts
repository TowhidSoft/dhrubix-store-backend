import { NextFunction, Request, Response } from "express";
import { ZodObject, ZodTypeAny } from "zod";

const validateRequest =
	(schema: ZodObject | ZodTypeAny) =>
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			try {
				const result = await schema.safeParse(req.body);
				if (!result.success) {
					return next(result.error);
				}
				return next();
			} catch (error) {
				next(error);
			}
		};

export default validateRequest;
