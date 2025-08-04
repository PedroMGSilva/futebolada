function getEnv(name: string, required = true): string {
  const value = process.env[name];
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value!;
}

export const config = {
  recaptchaV3SiteKey: getEnv("RECAPTCHA_V3_SITE_KEY"),
  recaptchaV3SecretKey: getEnv("RECAPTCHA_V3_SECRET_KEY"),
  db: {
    host: getEnv("DB_HOST"),
    port: parseInt(getEnv("DB_PORT", false) || "5432"),
    name: getEnv("DB_NAME"),
    user: getEnv("DB_USER"),
    password: getEnv("DB_PASSWORD"),
  },
};
