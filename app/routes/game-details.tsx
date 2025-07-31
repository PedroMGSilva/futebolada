import type { Route } from "./+types/game-details";
import {store} from "~/.server/db/store";
import {Form, Link, redirect} from "react-router";
import {getSession} from "~/.server/session";

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const gameId = params.gameId;

  const user = session.get("user");

  if (!user) {
    // Not logged in, redirect to login
    return redirect("/login");
  }

  const game = await store.games.getGame(gameId);

  return {game, user};
}


export async function action({ request, params }: Route.ActionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const user = session.get("user");

  if (!user) {
    // Not logged in, redirect to login
    return redirect("/login");
  }

  const gameId = params.gameId;
  if (!gameId) {
    throw new Response("Game ID required", { status: 400 });
  }

  await store.games.enrollInGame({gameId, userId: user.id});

  return redirect(`/games/${gameId}`); // Reload current game details page after enrolling
}

export default function GameDetails({
                                      loaderData,
                                    }: Route.ComponentProps) {

  const {game, user} = loaderData;

  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Game Details</h1>
      <p><strong>Date:</strong> {game.date}</p>
      <p><strong>Start Time:</strong> {game.startTime}</p>
      <p><strong>End Time:</strong> {game.endTime}</p>
      <p><strong>Location:</strong> {game.location}</p>
      <p><strong>Max Players:</strong> {game.maxPlayers}</p>
      <p><strong>Enrolled Players ({game.enrolledPlayers.length}):</strong></p>
      <ul className="list-disc ml-6 mb-6">
        {game.enrolledPlayers.length === 0 && <li>No players enrolled yet.</li>}
        {game.enrolledPlayers.map(player => (
          <li key={player.id}>{player.username}</li>
        ))}
      </ul>

      {/* Enroll form */}
      <Form method="post" className="mb-4">
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          disabled={game.enrolledPlayers.some(p => p.id === user.id)}
        >
          {game.enrolledPlayers.some(p => p.id === user.id) ? "Already enrolled" : "Enroll me"}
        </button>
      </Form>

      <Link to="/" className="text-blue-600 hover:underline">
        Back to games
      </Link>
    </main>
  );
}
