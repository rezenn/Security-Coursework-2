import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import User, { AuthProvider, UserRole } from "../models/user.model";
import config from "./env.config";
import logger from "../utils/logger.utils";

passport.use(
  new GoogleStrategy(
    {
      clientID: config.google.clientId,
      clientSecret: config.google.clientSecret,
      callbackURL: config.google.callbackUrl,
      scope: ["profile", "email"],
    },
    async (_accessToken, _refreshToken, profile: Profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error("No email from Google"), undefined);

        // 1. Try to find existing user by googleId
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // Already linked — just return
          return done(null, user);
        }

        // 2. Try to find existing user by email (local account → link Google)
        user = await User.findOne({ email });

        if (user) {
          // Link Google to existing local account
          user.googleId = profile.id;
          user.provider = AuthProvider.GOOGLE;
          user.isEmailVerified = true;
          if (!user.profile.avatarUrl && profile.photos?.[0]?.value) {
            user.profile.avatarUrl = profile.photos[0].value;
          }
          await user.save({ validateBeforeSave: false });
          return done(null, user);
        }

        // 3. Brand new user — create from Google profile
        const firstName = profile.name?.givenName || "";
        const lastName = profile.name?.familyName || "";

        // Generate a unique username from display name
        const base = (profile.displayName || email.split("@")[0])
          .toLowerCase()
          .replace(/[^a-z0-9_-]/g, "_")
          .replace(/_+/g, "_")
          .slice(0, 20);

        let username = base;
        let suffix = 1;
        while (await User.findOne({ username })) {
          username = `${base}${suffix++}`;
        }

        user = new User({
          email,
          username,
          googleId: profile.id,
          provider: AuthProvider.GOOGLE,
          role: UserRole.USER,
          isEmailVerified: true, // Google verifies emails
          isActive: true,
          profile: {
            firstName,
            lastName,
            bio: "",
            avatarUrl: profile.photos?.[0]?.value || null,
          },
        });

        await user.save({ validateBeforeSave: false });
        logger.info(`New Google OAuth user created: ${email}`);
        return done(null, user);
      } catch (err) {
        logger.error("Google OAuth error", { err });
        return done(err as Error, undefined);
      }
    },
  ),
);

// Serialize/deserialize not needed (stateless JWT — passport just validates)
passport.serializeUser((user: any, done) => done(null, user._id));
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export default passport;
