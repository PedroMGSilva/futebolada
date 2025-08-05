import type { Route } from "./+types/auth-google";
import { getSession } from "~/.server/session";
import { redirect } from "react-router";
import { google } from "googleapis";
import { config } from "~/.server/config";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));

  if (session.has("userId")) {
    // Redirect to the home page if they are already signed in.
    return redirect("/");
  }

  const oauth2Client = new google.auth.OAuth2(
    config.googleOAuth.clientId,
    config.googleOAuth.clientSecret,
    config.googleOAuth.redirectUri,
  );

  const scopes = ["openid", "profile", "email"];

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline", // to get refresh token if needed
    scope: scopes,
  });

  return redirect(url);
}
