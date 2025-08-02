
export async function validateRecaptchaToken(token: string) {
  const secret = process.env.RECAPTCHA_V3_SECRET_KEY || "6LfOn5crAAAAAAEmy9MkZNlBR_0MAzKs5-J8KKcR";
  if (!secret) {
    throw new Error("reCAPTCHA secret key not configured.");
  }

  const response = await fetch(
    `https://www.google.com/recaptcha/api/siteverify`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `secret=${secret}&response=${token}`,
    },
  );

  const json = await response.json();
  if (!json.success || json.score < 0.5) {
    throw new Error("reCAPTCHA verification failed.");
  }
}
