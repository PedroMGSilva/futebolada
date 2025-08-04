import type {Route} from "../../.react-router/types/app/routes/+types/register";
import { getSession} from "~/.server/session";
import { redirect} from "react-router";
import {google} from "googleapis";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));

  if (session.has("userId")) {
    // Redirect to the home page if they are already signed in.
    return redirect("/");
  }

  const oauth2Client = new google.auth.OAuth2(
    "188605057623-l369o9ph5t0kfbk3bde8l397bffluea4.apps.googleusercontent.com", // FIXME IT SHOULD BE IN ENV
    "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", // FIXME IT SHOULD BE IN ENV
    'http://localhost:3000/auth/google/callback'
  );

  const scopes = [
    'openid',
    'profile',
    'email'
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline', // to get refresh token if needed
    scope: scopes,
  });

  return redirect(url);
}
