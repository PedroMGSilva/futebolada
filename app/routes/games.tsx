import type { Route } from "./+types/games";
import {Link, type LoaderFunction, useLoaderData} from "react-router";
import {store} from "~/.server/db/store";
import {getLocationName, type Location} from "~/.server/domain/game";
import type {Game} from "~/.server/db/store/gamesStore";


export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export async function loader({ params }: Route.LoaderArgs) {
  const games = await store.games.getAllGames();

  const gamesWithLocation = await Promise.all(
    games.map(async (game) => {
      if (game.latitude != null && game.longitude != null) {
        const locationName = await getLocationName(game.latitude, game.longitude);
        return {
          ...game,
          location: locationName
        };
      }
      return {...game, location: undefined };
    })
  );

  return {games: gamesWithLocation};
}

  function formatLocation(location?: Location): string {
    if (!location) return "Unknown location";

    // Pick fields you want to show, prioritize more specific first:
    const parts = [
      location.amenity,
      location.road,
      location.neighbourhood,
      location.town,
    ];

    // Filter out falsy values and join with commas
    return parts.filter(Boolean).join(", ");
  }

export default function Games({
                                loaderData,
                              }: Route.ComponentProps) {

  const {games} = loaderData;

  return <main className="p-6 max-w-2xl mx-auto">
    <h1 className="text-2xl font-bold mb-4">Upcoming Matches</h1>
    <div className="mb-6">
      <Link
        to="/games/create"
        className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
      >
        + Add Game
      </Link>
    </div>
    <ul className="space-y-4">
      {games.map((game) => (
        <li
          key={game.id}
          className="border p-4 rounded shadow-sm hover:bg-gray-50 transition"
        >
          <Link to={`/games/${game.id}`} className="block">
            <p className="font-semibold text-lg">
              {new Date(`${game.date}T${game.startTime}`).toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">{formatLocation(game.location)}</p>
            <p className="text-sm">
              Players: {game.enrolledPlayers.length} / {game.maxPlayers}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  </main>;
}
