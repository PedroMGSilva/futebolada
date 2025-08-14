import type { Route } from "./+types/game-details";
import { store } from "app/.server/db/operations";
import { Form, Link, redirect } from "react-router";
import { getSession } from "~/.server/session";

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const gameId = params.gameId;

  const userId = session.get("userId")!;
  const user = (await store.users.getUserById(session.get("userId")!))!;

  if (user.role !== "admin") {
    throw new Response("You are not authorized to assign teams", {
      status: 403,
    });
  }

  const game = await store.games.getGameById(gameId);

  if (game === null) {
    throw new Response("Game not found", { status: 404 });
  }

  return { game, userId };
}

export async function action({ request, params }: Route.ActionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId")!;

  if (!userId) return redirect("/login");

  const user = (await store.users.getUserById(session.get("userId")!))!;

  if (user.role !== "admin") {
    throw new Response("You are not authorized to assign teams", {
      status: 403,
    });
  }

  const gameId = params.gameId;
  if (!gameId) throw new Response("Game ID required", { status: 400 });

  const formData = await request.formData();

  const playerEnrolledId = formData.get("playerEnrolledId");
  const team = formData.get("team");
  if (!playerEnrolledId || typeof playerEnrolledId !== "string") {
    throw new Response("Missing playerEnrolledId", { status: 400 });
  }

  const playerEnrolled =
    await store.playersEnrolled.getPlayerEnrolledById(playerEnrolledId);
  if (!playerEnrolled) {
    throw new Response("Player not found", { status: 400 });
  }

  if (
    team &&
    (typeof team !== "string" || (team !== "white" && team !== "black"))
  ) {
    throw new Response("Invalid team", { status: 400 });
  }

  if (team !== "white" && team !== "black" && team !== "") {
    throw new Response("Invalid team", { status: 400 });
  }

  await store.playersEnrolled.assignTeamToPlayerEnrolled({
    playerEnrolledId: playerEnrolled.id,
    team: team || null,
  });

  return redirect(`/games/${gameId}/team-assignment`);
}

export default function GameDetails({ loaderData }: Route.ComponentProps) {
  const { game } = loaderData;

  const unassignedPlayersEnrolled = game.playersEnrolled.filter((p) => !p.team);

  const whiteTeamPlayersEnrolled = game.playersEnrolled.filter(
    (p) => p.team === "white",
  );
  const blackTeamPlayersEnrolled = game.playersEnrolled.filter(
    (p) => p.team === "black",
  );

  return (
    <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center md:text-left mb-4 md:mb-0">
          Team Assignment
        </h1>
        <Link
          to={`/games/${game.id}`}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
        >
          &larr; Back to Game
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Unassigned Players Column */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-3 mb-4">
            Unassigned
          </h3>
          <ul className="space-y-3">
            {unassignedPlayersEnrolled.map((playerEnrolled) => (
              <li
                key={playerEnrolled.id}
                className="flex items-center justify-between bg-gray-100 dark:bg-gray-700/50 p-3 rounded-lg"
              >
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {playerEnrolled.player.user?.display_name ||
                    playerEnrolled.player.guest?.name}
                </span>
                <Form method="post" className="flex items-center gap-2">
                  <input
                    type="hidden"
                    name="playerEnrolledId"
                    value={playerEnrolled.id}
                  />
                  <button
                    type="submit"
                    name="team"
                    value="white"
                    className="px-3 py-1 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-100 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500"
                  >
                    White
                  </button>
                  <button
                    type="submit"
                    name="team"
                    value="black"
                    className="px-3 py-1 text-xs font-semibold text-white bg-gray-800 border border-transparent rounded-full hover:bg-gray-900 dark:bg-gray-900 dark:hover:bg-black"
                  >
                    Black
                  </button>
                </Form>
              </li>
            ))}
          </ul>
        </div>

        {/* White Team Column */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-white bg-gray-400 dark:bg-gray-300 dark:text-gray-800 -m-6 mb-4 p-6 rounded-t-xl">
            White Team
          </h3>
          <ul className="space-y-3">
            {whiteTeamPlayersEnrolled.map((playerEnrolled) => (
              <li
                key={playerEnrolled.id}
                className="flex items-center justify-between bg-gray-100 dark:bg-gray-700/50 p-3 rounded-lg"
              >
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {playerEnrolled.player.user?.name ||
                    playerEnrolled.player.guest?.name}
                </span>
                <Form method="post">
                  <input
                    type="hidden"
                    name="playerEnrolledId"
                    value={playerEnrolled.id}
                  />
                  <input type="hidden" name="team" value="" />
                  <button
                    type="submit"
                    className="px-3 py-1 text-xs font-semibold text-red-600 bg-red-100 border border-red-200 rounded-full hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800 dark:hover:bg-red-900"
                  >
                    Remove
                  </button>
                </Form>
              </li>
            ))}
          </ul>
        </div>

        {/* Black Team Column */}
        <div className="bg-gray-900 rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-white -m-6 mb-4 p-6 rounded-t-xl">
            Black Team
          </h3>
          <ul className="space-y-3">
            {blackTeamPlayersEnrolled.map((playerEnrolled) => (
              <li
                key={playerEnrolled.id}
                className="flex items-center justify-between bg-gray-800 p-3 rounded-lg"
              >
                <span className="font-medium text-gray-200">
                  {playerEnrolled.player.user?.name ||
                    playerEnrolled.player.guest?.name}
                </span>
                <Form method="post">
                  <input
                    type="hidden"
                    name="playerEnrolledId"
                    value={playerEnrolled.id}
                  />
                  <input type="hidden" name="team" value="" />
                  <button
                    type="submit"
                    className="px-3 py-1 text-xs font-semibold text-red-300 bg-red-900/50 border border-red-800 rounded-full hover:bg-red-900"
                  >
                    Remove
                  </button>
                </Form>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
