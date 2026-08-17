import express from "express";
import passport from "../../../../config/passport";
import { GenerateTokens } from "../../../../helpers/utility/tokenHelper";
import { Role } from "@prisma/client";

const router = express.Router();

interface GoogleUser {
  id: string;
  email: string;
  name: string;
  role?: string;
}

// Step 1: Redirect to Google login
router.get("/", (req, res, next) => {
  const state = req.query.state || "";

  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: JSON.stringify({ state }),
  })(req, res, next);
});

// Step 2: Google callback
router.get("/callback", (req, res, next) => {
  passport.authenticate(
    "google",
    { session: false },
    (err, user: GoogleUser) => {
      if (err) {
        console.error("Google OAuth Error:", err.message);
        const frontendURL = process.env.FRONTEND_URL || process.env.FRONTEND_URL_LOCAL;
        return res.redirect(`${frontendURL}/login-failed?message=${encodeURIComponent(err.message)}`
        );
      }

      // Generate tokens
      const tokens = GenerateTokens(user.id, user.email, user.role || Role.CUSTOMER);

      res
        .cookie("accessToken", tokens.accessToken, { httpOnly: true, secure: true, sameSite: "lax" })
        .cookie("refreshToken", tokens.refreshToken, { httpOnly: true, secure: true, sameSite: "lax" });

      const frontendURL = process.env.FRONTEND_URL || process.env.FRONTEND_URL_LOCAL;
      res.redirect(`${frontendURL}/login-success?googleAuth=true&token=${tokens.accessToken}&role=${user.role}`);
    }
  )(req, res, next);
});

export const GoogleAuth = router;
