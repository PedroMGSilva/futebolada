import type { Route } from "./+types/auth-facebook";
import { getSession } from "~/.server/session";
import { redirect } from "react-router";
import { config } from "~/.server/config";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));

  if (session.has("userId")) {
    // Redirect to the home page if they are already signed in.
    return redirect("/");
  }

  const params = new URLSearchParams({
    client_id: config.facebookOAuth.clientId,
    redirect_uri: config.facebookOAuth.redirectUri,
    state: "some-random-string", // use for CSRF protection
    scope: "email public_profile",
    response_type: "code",
  });

  const url = `https://www.facebook.com/v16.0/dialog/oauth?${params.toString()}`;

  return redirect(url);
}
