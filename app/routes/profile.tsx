import type { Route } from "./+types/profile";
import {
  Form,
  Link,
  redirect,
  useActionData,
  type ActionFunction,
  useNavigation,
} from "react-router";
import { store } from "app/.server/db/operations";
import { getSession } from "~/.server/session";

type ActionData = {
  error?: string;
};

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));

  if (!session.has("userId")) {
    return redirect("/login");
  }

  const user = await store.users.getUserById(session.get("userId")!);

  if (!user) {
    throw new Response("User not found", { status: 404 });
  }

  const displayName = user.display_name;

  return { displayName };
}

export const action: ActionFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));

  if (!session.has("userId")) {
    return redirect("/login");
  }

  const formData = await request.formData();
  const name = formData.get("name");

  // Basic validation
  if (!name || typeof name !== "string") {
    return { error: "All fields are required" };
  }

  await store.users.updateUserDisplayName({
    id: session.get("userId"),
    displayName: name,
    actorId: session.get("userId"),
  });

  // After successful save, redirect to home
  return redirect("/");
};

export default function Profile({ loaderData }: Route.ComponentProps) {
  const { displayName } = loaderData;
  const actionData = useActionData<ActionData>();

  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center sm:text-left mb-4 sm:mb-0">
          Edit Profile
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
          <label htmlFor="name" className="block mb-1 font-semibold">
            Display Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            defaultValue={displayName}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <button
          type="submit"
          className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition flex items-center justify-center ${
            !isSubmitting ? "cursor-pointer" : "cursor-not-allowed"
          }`}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin h-5 w-5 mr-2 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              Updating...
            </>
          ) : (
            "Update Profile"
          )}
        </button>
      </Form>
    </main>
  );
}
