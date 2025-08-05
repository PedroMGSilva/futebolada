import { redirect } from "react-router";
import { getSession } from "~/.server/session";
import type { Route } from "./+types/login";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));

  if (session.has("userId")) {
    // Redirect to the home page if they are already signed in.
    return redirect("/");
  }
}

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="shadow-md rounded-lg p-8 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-6">Sign in to Futebolada</h1>

        <div className="space-y-4">
          <a
            href="/auth/google"
            className="w-full inline-block bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition"
          >
            <div className="flex items-center justify-center gap-2">
              <img
                src="https://developers.google.com/identity/images/g-logo.png"
                alt="Google"
                className="w-5 h-5"
              />
              <span>Continue with Google</span>
            </div>
          </a>

          <a
            href="/auth/facebook"
            className="w-full inline-block bg-[#1877F2] text-white py-2 px-4 rounded-md hover:bg-[#145DBF] transition"
          >
            <div className="flex items-center justify-center gap-2">
              <img
                src="https://www.facebook.com/images/fb_icon_325x325.png"
                alt="Facebook"
                className="w-5 h-5 rounded-sm"
              />
              <span>Continue with Facebook</span>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
