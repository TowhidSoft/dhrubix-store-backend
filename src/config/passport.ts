import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import prisma from "./db.prisma";
import { Role } from "@prisma/client";

const backendURL = process.env.BACKEND_URL || process.env.BACKEND_URL_LOCAL;

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: `${backendURL}/api/v1/googleAuth/callback`,
      passReqToCallback: true,
    },
    async (req: any, accessToken, refreshToken, profile: Profile, done) => {
      try {
        const email = profile.emails?.[0].value;
        if (!email) return done(new Error("No email from Google"));

        let user = await prisma.user.findUnique({
          where: { email },
        });
        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              password: "",
              name: profile.displayName || "No Name",
              isGoogleAuth: true,
              role: Role.CUSTOMER
            },
          });

          await prisma.profile.create({
            data: {
              userId: user.id,
              fullName: user.name,
            }
          })
        }
        return done(null, user);
      } catch (err) {
        return done(err as Error);
      }
    }
  )
);

export default passport;
