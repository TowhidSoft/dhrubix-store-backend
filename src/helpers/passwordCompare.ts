import bcrypt from "bcrypt";
import { bcryptSaltRound } from "../config/config";

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = Number(bcryptSaltRound);
  return await bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};
