// auth/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL, NODE_ENV, PORT, DASHBOARD_PORT } = process.env;

// Determine callback URL based on environment to avoid redirecting to production in dev
let callbackURL = GOOGLE_CALLBACK_URL;
if (NODE_ENV !== 'production') {
  const port = PORT || DASHBOARD_PORT || 3000;
  callbackURL = `http://localhost:${port}/auth/google/callback`;
  console.log(`Using development callback URL: ${callbackURL}`);
}

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL,
    },
    (accessToken, refreshToken, profile, done) => {
      // No necesitamos guardar el usuario, solo pasarlo a la siguiente etapa.
      // El perfil contiene toda la info necesaria (id, displayName, email, etc.)
      console.log(`Usuario autenticado a través de Google: ${profile.emails[0].value}`);
      return done(null, { profile, accessToken });
    }
  )
);