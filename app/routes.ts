import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  layout("routes/layout.tsx", [
    index("routes/index.tsx"),
    route("games/create", "routes/create-game.tsx"),
    route("games/:gameId", "routes/game-details.tsx"),
    route("logout", "routes/logout.tsx"),
  ]),
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),
  route("auth/google", "routes/auth-google.tsx"),
  route("auth/google/callback", "routes/auth-google-callback.tsx"),
  route("auth/facebook", "routes/auth-facebook.tsx"),
  route("auth/facebook/callback", "routes/auth-facebook-callback.tsx"),
] satisfies RouteConfig;
