declare module "email-existence" {
  const emailExistence: {
    check(
      email: string,
      callback: (error: any, response: boolean) => void
    ): void;
  };

  export = emailExistence;
}
