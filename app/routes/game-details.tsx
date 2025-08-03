import type { Route } from "./+types/game-details";
import { store } from "app/.server/db/operations";
import { Form, Link, redirect } from "react-router";
import { getSession } from "~/.server/session";
import { CalendarIcon, ClockIcon, CurrencyEuroIcon } from "@heroicons/react/16/solid";
import {v4 as uuidv4} from "uuid";

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const gameId = params.gameId;

  const userId = session.get("userId")!!;

  const game = await store.games.getGameById(gameId);

  if(game === null) {
    throw new Response("Game not found", { status: 404 });
  }
  return { game, userId };
}

export async function action({ request, params }: Route.ActionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId")!!;

  if (!userId) {
    // Not logged in, redirect to login
    return redirect("/login");
  }

  const gameId = params.gameId;
  if (!gameId) {
    throw new Response("Game ID required", { status: 400 });
  }

  const formData = await request.formData();
  const actionType = formData.get("_action");

  if (actionType === "unenroll") {
    const player = await store.players.getByUserId(userId)

    if(!player) {
      throw new Response("Player not found for user", { status: 400 });
    }

    await store.games.unenrollFromGame({ gameId, playerId: player.id });
  } else if (actionType === "enroll") {

    const game = await store.games.getGameById(gameId);

    if(game === null) {
      throw new Response("Game not found", { status: 404 });
    }

    const position = formData.get("position");

    if (
      !position ||
      typeof position !== "string"
    ) {
      return { error: "All fields are required" };
    }

    const positionNum = Number(position);
    if (isNaN(positionNum) || positionNum < 1 || positionNum > game.maxPlayers) {
      throw new Response("Invalid position", { status: 400 });
    }

    const player = await store.players.getByUserId(userId);
    if (!player) {
      throw new Response("Player not found for user", { status: 400 });
    }

    const id = uuidv4();

    await store.games.enrollInGame({ playerEnrolledId: id, gameId, playerId: player.id, position: positionNum, actorId: userId });
  }

  return redirect(`/games/${gameId}`); // Reload current game details page after enrolling
}

export default function GameDetails({ loaderData }: Route.ComponentProps) {
  const { game, userId } = loaderData;
  const isEnrolled = game.playersEnrolled.some(
    (p) => p.player.user?.id === userId
  );

  return (
    <main className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center md:text-left">
        Game Details
      </h1>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Left panel: game details */}
        <section className="md:w-1/2 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="flex items-center gap-3 mb-6">
            <CalendarIcon className="w-6 h-6 text-blue-600"/>
            <span className="text-xl font-semibold">
              {new Date(game.date).toLocaleDateString(undefined, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </p>
          <p className="flex items-center gap-3 mb-6">
            <ClockIcon className="w-6 h-6 text-blue-600"/>
            <span className="text-xl font-semibold">
              {game.startTime.slice(0, 5)} - {game.endTime.slice(0, 5)}
            </span>
          </p>
          <p className="flex items-center gap-3 mb-6">
            <CurrencyEuroIcon className="w-6 h-6 text-blue-600"/>
            <span className="text-xl font-semibold">
              {(game.price / 100).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </p>

          <div className="mt-8 flex-grow">
            <iframe
              title="Game Location Map"
              className="w-full h-100 rounded-md border"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps?q=${game.latitude},${game.longitude}&z=15&output=embed`}
            />
          </div>
        </section>

        {/* Right panel: enrolled players + enroll button */}
        <section className="md:w-1/2 bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col">
          <h2 className="text-xl font-semibold mb-4">
            Enrolled Players ({game.playersEnrolled.length}/{game.maxPlayers})
          </h2>
          <ul className="flex-grow overflow-auto list-none mb-6 space-y-2">
            {[...Array(game.maxPlayers)].map((_, i) => {
              const playerEnrolled = game.playersEnrolled.find(p => p.position === i + 1);
              return (
                <li
                  key={i}
                  className="flex justify-between items-center border-b pb-2"
                >
    <span>
      {playerEnrolled ? (
        playerEnrolled.player.user?.name ||
        playerEnrolled.player.guest?.name ||
        "Unknown"
      ) : (
        <span className="text-gray-400 italic">Empty Slot</span>
      )}
    </span>

                  {playerEnrolled ? (
                    playerEnrolled.player.user?.id === userId && (
                      <Form method="post">
                        <input type="hidden" name="_action" value="unenroll"/>
                        <button
                          type="submit"
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </Form>
                    )
                  ) : (
                    !isEnrolled && (
                      <Form method="post">
                        <input type="hidden" name="_action" value="enroll"/>
                        <input type="hidden" name="position" value={i + 1}/>
                        <button
                          type="submit"
                          className="text-sm text-green-600 hover:text-green-800"
                        >
                          Enroll here
                        </button>
                      </Form>
                    )
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <div className="mt-6 text-center md:text-left">
        <Link to="/" className="text-blue-600 hover:underline">
          &larr; Back to games
        </Link>
      </div>
    </main>
  );
}
