import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  layout("routes/layout.tsx", [
    index("routes/games.tsx"),
    route("games/create", "routes/create-game.tsx"),
    route("games/:gameId", "routes/game-details.tsx"),
    route("login", "routes/login.tsx"),
    route("register", "routes/register.tsx"),
    route("logout", "routes/logout.tsx"),
  ]),
] satisfies RouteConfig;
