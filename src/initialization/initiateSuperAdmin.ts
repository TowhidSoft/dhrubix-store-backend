import bcrypt from "bcrypt";
import prisma from "../config/db.prisma"
import { Prisma, Role } from "@prisma/client";

export const initiateSuperAdmin = async () => {
	const payload = {
		name: "Mr. Admin",
		phone: "12345678901",
		email: process.env.Admin_Email || "admin@gmail.com",
		password: "123456",
		isEmailVerified: true,
		role: Role.ADMIN,
	};

	const existingAdmin = await prisma.user.	findUnique({
		where: { email: payload.email },
	});

	if (existingAdmin) {
		return;
	}

	await prisma.$transaction(async (TX: Prisma.TransactionClient) => {
		const hashedPassword: string = await bcrypt.hash(payload.password, 12);

		const user = await TX.user.create({
			data: {
				...payload,
				password: hashedPassword,
			},
		});
		if (user.role == Role.ADMIN) {
			await TX.profile.create({ data: { userId: user.id, fullName: user.name ?? "" } });
		}
	});
};
