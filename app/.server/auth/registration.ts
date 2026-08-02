import { config } from "~/.server/config";

export function assertCanRegister(email: string): void {
  const normalized = email.trim().toLowerCase();

  if (config.registration.allowedEmails.includes(normalized)) return;

  console.warn(`Blocked registration for ${normalized}`);

  throw new Response(
    "This app is invite only. Ask the organiser to add your email address.",
    { status: 403 },
  );
}
