import { config } from "~/.server/config";

export function getFacebookLoginUrl() {
  const params = new URLSearchParams({
    client_id: config.facebookOAuth.clientId,
    redirect_uri: config.facebookOAuth.redirectUri,
    state: "some-random-string", // use for CSRF protection
    scope: "email public_profile",
    response_type: "code",
  });
  return `https://www.facebook.com/v16.0/dialog/oauth?${params.toString()}`;
}

export async function getAccessToken(code: string) {
  const tokenUrl = new URL(
    "https://graph.facebook.com/v16.0/oauth/access_token",
  );
  tokenUrl.searchParams.set("client_id", config.facebookOAuth.clientId);
  tokenUrl.searchParams.set("redirect_uri", config.facebookOAuth.redirectUri);
  tokenUrl.searchParams.set("client_secret", config.facebookOAuth.clientSecret);
  tokenUrl.searchParams.set("code", code);

  const res = await fetch(tokenUrl.toString());
  const data = await res.json();
  return data.access_token;
}

export async function getFacebookUserProfile(accessToken: string) {
  const profileUrl = new URL("https://graph.facebook.com/me");
  profileUrl.searchParams.set("fields", "id,name,email");
  profileUrl.searchParams.set("access_token", accessToken);

  const res = await fetch(profileUrl.toString());
  const profile = await res.json();
  return profile;
}
