import emailExistence from "email-existence";

export const verifyEmailSMTP = (email: string): Promise<boolean> => {
  return new Promise((resolve) => {
    emailExistence.check(email, (error: any, response: boolean) => {
      if (error) {
        console.error("SMTP check error:", error);
        return resolve(false);
      }
      resolve(response);
    });
  });
};
