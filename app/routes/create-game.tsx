import {
  type ActionFunction,
  Form,
  Link,
  redirect,
  useActionData,
} from "react-router";
import { store } from "~/.server/db/store";
import { getLocationName } from "~/.server/domain/game";

type ActionData = {
  error?: string;
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const date = formData.get("date");
  const startTime = formData.get("startTime");
  const endTime = formData.get("endTime");
  const latitude = formData.get("latitude");
  const longitude = formData.get("longitude");
  const maxPlayers = formData.get("maxPlayers");

  // Basic validation
  if (
    !date ||
    typeof date !== "string" ||
    !startTime ||
    typeof startTime !== "string" ||
    !endTime ||
    typeof endTime !== "string" ||
    !latitude ||
    typeof latitude !== "string" ||
    !longitude ||
    typeof longitude !== "string" ||
    !maxPlayers ||
    typeof maxPlayers !== "string"
  ) {
    return { error: "All fields are required" };
  }

  const latNum = Number(latitude);
  const lonNum = Number(longitude);
  if (isNaN(latNum) || isNaN(lonNum)) {
    return { error: "Latitude and longitude must be valid numbers" };
  }

  const locationName = await getLocationName(latNum, lonNum);

  await store.games.createGame({
    date,
    startTime,
    endTime,
    latitude: latNum,
    longitude: lonNum,
    location: locationName || "Unknown Location",
    maxPlayers: Number(maxPlayers),
  });

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
          <label htmlFor="latitude" className="block mb-1 font-semibold">
            Latitude
          </label>
          <input
            id="latitude"
            type="number"
            name="latitude"
            step="any"
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="longitude" className="block mb-1 font-semibold">
            Longitude
          </label>
          <input
            id="longitude"
            type="number"
            name="longitude"
            step="any"
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

      <div className="mt-6 text-center md:text-left">
        <Link to="/" className="text-blue-600 hover:underline">
          &larr; Back to games
        </Link>
      </div>
    </main>
  );
}
