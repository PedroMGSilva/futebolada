import type { Route } from "./+types/index";
import { Link, redirect } from "react-router";
import { store } from "app/.server/db/operations";
import {
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
} from "@heroicons/react/16/solid";
import { getSession } from "~/.server/session";

// eslint-disable-next-line
export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));

  if (!session.has("userId")) {
    return redirect("/login");
  }

  const { games: upcomingGames } = await store.games.getUpcomingGames();

  const user = await store.users.getUserById(session.get("userId")!);

  if (!user) {
    throw new Response("User not found", { status: 404 });
  }

  const role = user.role;

  return { upcomingGames, role };
}

export default function Index({ loaderData }: Route.ComponentProps) {
  const { upcomingGames, role } = loaderData;

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Games</h1>
        {role === "admin" && (
          <Link
            to="/games/create"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            + Add Game
          </Link>
        )}
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <span
            className="border-blue-500 text-blue-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
            aria-current="page"
          >
            Upcoming
          </span>
          <Link
            to="/games/past"
            className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
          >
            Past
          </Link>
        </nav>
      </div>
      {upcomingGames.length > 0 ? (
        <ul className="space-y-4">
          {upcomingGames.map((game) => (
            <li
              key={game.id}
              className="border p-4 rounded shadow-sm hover:bg-gray-50 transition"
            >
              <Link to={`/games/${game.id}`} className="block">
                <p className="flex items-center gap-2 mb-2">
                  <CalendarIcon className="w-6 h-6 text-blue-600" />
                  <span className="text-lg font-semibold">
                    {new Date(game.date).toLocaleDateString("pt-PT", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </p>
                <p className="flex items-center gap-3 mb-2">
                  <ClockIcon className="w-6 h-6 text-blue-600" />
                  <span className="text-lg font-semibold">
                    {game.startTime.slice(0, 5)} - {game.endTime.slice(0, 5)}
                  </span>
                </p>
                <p className="flex items-center gap-2 mb-2">
                  <UserGroupIcon className={"w-6 h-6 text-blue-600"} />
                  <span className={"text-lg font-semibold"}>
                    {game.playersEnrolled.length} / {game.maxPlayers}
                  </span>
                </p>
                <p className="text-sm text-gray-600">{game.location}</p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-10 border rounded-lg">
          <p className="text-gray-500">No games scheduled.</p>
        </div>
      )}
    </main>
  );
}
