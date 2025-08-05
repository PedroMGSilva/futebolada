import type { Route } from "./+types/auth-google-callback";
import { getSession, commitSession } from "~/.server/session";
import { redirect } from "react-router";
import { google } from "googleapis";
import { config } from "~/.server/config";
import { store } from "~/.server/db/operations";
import { v4 as uuidv4 } from "uuid";

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

  const url = new URL(request.url);
  const code = url.searchParams.get("code") || "";
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  const oauth2 = google.oauth2({ auth: oauth2Client, version: "v2" });
  const userinfo = await oauth2.userinfo.get();

  if (!userinfo.data.email) {
    throw new Error("Google user info does not contain an email.");
  }

  if (!userinfo.data.id) {
    throw new Error("Google user info does not contain an id.");
  }

  let user = await store.users.getUserByAuthProviderId(
    userinfo.data.id,
    "google",
  );

  if (!user) {
    const userId = uuidv4();
    const playerId = uuidv4();
    // Create new user with info from Google
    const { user: createdUser } = await store.users.createUserAndPlayer({
      userId: userId,
      playerId: playerId,
      email: userinfo.data.email,
      name: userinfo.data.name || "No name",
      password: null,
      authProvider: "google",
      authProviderId: userinfo.data.id,
    });

    user = createdUser;
  }

  session.set("userId", user.id);

  return redirect("/", {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}
