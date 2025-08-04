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


  const url = new URL(request.url);
  const code = url.searchParams.get("code") || "";
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  // Get user profile info
  const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });
  const userinfo = await oauth2.userinfo.get();

  console.log("User Info:", userinfo.data);

  // userinfo.data contains Google user info (email, name, id, etc)

  // Find or create user in your DB using userinfo.data.email or id
  // Create session, redirect to your app

  return redirect('/');
}
