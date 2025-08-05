import type { Route } from "./+types/create-game";
import {
  type ActionFunction,
  Form,
  Link,
  redirect,
  useActionData,
} from "react-router";
import { store } from "app/.server/db/operations";
import { getLocationName } from "~/.server/domain/game";
import { v4 as uuidv4 } from "uuid";
import { getSession } from "~/.server/session";

type ActionData = {
  error?: string;
};

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));

  const user = (await store.users.getUserById(session.get("userId")!))!;

  if (user.role !== "admin") {
    throw new Response("You are not authorized to create games", {
      status: 403,
    });
  }
}

export const action: ActionFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));

  const formData = await request.formData();
  const date = formData.get("date");
  const startTime = formData.get("startTime");
  const endTime = formData.get("endTime");
  const latitude = formData.get("latitude");
  const longitude = formData.get("longitude");
  const maxPlayers = formData.get("maxPlayers");
  const price = formData.get("price");

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
    typeof maxPlayers !== "string" ||
    !price ||
    typeof price !== "string"
  ) {
    return { error: "All fields are required" };
  }

  const latNum = Number(latitude);
  const lonNum = Number(longitude);
  const maxPlayersNum = Number(maxPlayers);
  const priceNum = Number(price);
  if (isNaN(latNum) || isNaN(lonNum)) {
    return { error: "Latitude and longitude must be valid numbers" };
  }

  if (isNaN(maxPlayersNum) || maxPlayersNum < 1) {
    return { error: "Max players must be a positive number" };
  }

  if (isNaN(priceNum) || priceNum < 0) {
    return { error: "Price must be a non-negative number" };
  }

  // Convert price in dollars to cents (integer)
  const priceCents = Math.round(priceNum * 100);

  const locationName = await getLocationName(latNum, lonNum);
  const id = uuidv4();

  await store.games.createGame({
    id,
    date,
    startTime,
    endTime,
    latitude: latNum,
    longitude: lonNum,
    location: locationName || "Unknown Location",
    maxPlayers: maxPlayersNum,
    price: priceCents,
    createdBy: session.get("userId")!,
    updatedBy: session.get("userId")!,
  });

  // After successful save, redirect to home or calendar page
  return redirect("/");
};
export default function CreateGame() {
  const actionData = useActionData<ActionData>();

  return (
    <main className="p-6 max-w-md mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center sm:text-left mb-4 sm:mb-0">
          Create New Game
        </h1>
        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 border border-transparent rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          &larr; Back to Games
        </Link>
      </div>
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

        <div>
          <label htmlFor="price" className="block mb-1 font-semibold">
            Price (in euros)
          </label>
          <input
            id="price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            defaultValue="0.00"
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
