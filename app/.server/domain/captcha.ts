import {config} from "~/.server/config";

export async function validateRecaptchaToken(token: string) {

  const response = await fetch(
    `https://www.google.com/recaptcha/api/siteverify`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `secret=${config.recaptchaV3SecretKey}&response=${token}`,
    },
  );

  const json = await response.json();
  if (!json.success || json.score < 0.5) {
    throw new Error("reCAPTCHA verification failed.");
  }
}
