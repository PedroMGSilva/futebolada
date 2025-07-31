import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/games.tsx"),
  route("games/create", "routes/create-game.tsx"),
  route("games/:gameId", "routes/game-details.tsx"),
  route("login", "routes/login.tsx"),
  route("logout", "routes/logout.tsx"),
] satisfies RouteConfig;
