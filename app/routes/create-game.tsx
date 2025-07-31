import {type ActionFunction, Form, redirect, useActionData} from "react-router";
import {store} from "~/.server/db/store";

type ActionData = {
  error?: string;
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const date = formData.get("date");
  const startTime = formData.get("startTime");
  const endTime = formData.get("endTime");
  const location = formData.get("location");
  const maxPlayers = formData.get("maxPlayers");

  // Basic validation
  if (
    !date || typeof date !== "string" ||
    !startTime || typeof startTime !== "string" ||
    !endTime || typeof endTime !== "string" ||
    !location || typeof location !== "string" ||
    !maxPlayers || typeof maxPlayers !== "string"
  ) {
    return { error: "All fields are required" };
  }

  await store.games.createGame({
    date,
    startTime,
    endTime,
    location,
    maxPlayers: Number(maxPlayers),
  })

  // After successful save, redirect to home or calendar page
  return redirect("/");
};
export default function CreateGame() {
  const actionData = useActionData<ActionData>();

  return (
    <main className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Game</h1>
      <Form method="post" className="space-y-4">
        {actionData?.error && (
          <p className="text-red-600 font-semibold">{actionData.error}</p>
        )}

        <div>
          <label htmlFor="date" className="block mb-1 font-semibold">
            Date
          </label>
          <input
            id="date"
            type="date"
            name="date"
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="startTime" className="block mb-1 font-semibold">
            Start Time
          </label>
          <input
            id="startTime"
            type="time"
            name="startTime"
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="endTime" className="block mb-1 font-semibold">
            End Time
          </label>
          <input
            id="endTime"
            type="time"
            name="endTime"
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="location" className="block mb-1 font-semibold">
            Location
          </label>
          <input
            id="location"
            type="text"
            name="location"
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="maxPlayers" className="block mb-1 font-semibold">
            Max Players
          </label>
          <input
            id="maxPlayers"
            type="number"
            name="maxPlayers"
            min={1}
            max={100}
            defaultValue={10}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Create Game
        </button>
      </Form>
    </main>
  );
}