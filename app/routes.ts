import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  layout("routes/layout.tsx", [
    index("routes/index.tsx"),
    route("games/past", "routes/past-games.tsx"),
    route("games/create", "routes/create-game.tsx"),
    route("games/:gameId", "routes/game-details.tsx"),
    route("games/:gameId/team-assignment", "routes/team-assignment.tsx"),
    route("profile", "routes/profile.tsx"),
    route("logout", "routes/logout.tsx"),
  ]),
  route("login", "routes/login.tsx"),
  route("auth/google", "routes/auth-google.tsx"),
  route("auth/google/callback", "routes/auth-google-callback.tsx"),
  route("auth/facebook", "routes/auth-facebook.tsx"),
  route("auth/facebook/callback", "routes/auth-facebook-callback.tsx"),
  route("privacy-policy", "routes/privacy-policy.tsx"),
  route("facebook-data-deletion", "routes/facebook-data-deletion.tsx"),
] satisfies RouteConfig;
