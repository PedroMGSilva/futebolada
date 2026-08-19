function getEnv(name: string, required = true): string {
  const value = process.env[name];
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value!;
}

function getEnvList(name: string): string[] {
  return (process.env[name] ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export const config = {
  app: {
    baseUrl: getEnv("APP_BASE_URL").replace(/\/+$/, ""),
  },
  db: {
    host: getEnv("DB_HOST"),
    port: parseInt(getEnv("DB_PORT", false) || "5432"),
    name: getEnv("DB_NAME"),
    user: getEnv("DB_USER"),
    password: getEnv("DB_PASSWORD"),
  },
  googleOAuth: {
    clientId: getEnv("GOOGLE_CLIENT_ID"),
    clientSecret: getEnv("GOOGLE_CLIENT_SECRET"),
    redirectUri: getEnv("GOOGLE_REDIRECT_URI"),
  },
  facebookOAuth: {
    clientId: getEnv("FACEBOOK_CLIENT_ID"),
    clientSecret: getEnv("FACEBOOK_CLIENT_SECRET"),
    redirectUri: getEnv("FACEBOOK_REDIRECT_URI"),
  },
  session: {
    secret: getEnv("SESSION_SECRET"),
  },
  registration: {
    allowedEmails: getEnvList("ALLOWED_EMAILS"),
  },
  waha: {
    baseUrl: getEnv("WAHA_BASE_URL"),
    apiKey: getEnv("WAHA_API_KEY"),
    chatId: getEnv("WAHA_CHAT_ID"),
  },
};
