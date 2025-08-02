import { data, Link, redirect, useFetcher } from "react-router";
import { commitSession, getSession } from "~/.server/session";
import type { Route } from "./+types/login";
import { validateCredentials } from "~/.server/domain/auth";
import { validateRecaptchaToken } from "~/.server/domain/captcha";
import {
  GoogleReCaptchaProvider,
  useGoogleReCaptcha,
} from "react-google-recaptcha-v3";
import { type FormEvent, useCallback, useRef } from "react";

// This should be an environment variable
const RECAPTCHA_V3_SITE_KEY = "6LfOn5crAAAAAKXNFEFR8zsoYYnClH4S3oRqJ-IK";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));

  if (session.has("user")) {
    // Redirect to the home page if they are already signed in.
    return redirect("/");
  }

  return data(
    { error: session.get("error") },
    {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    },
  );
}

export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const form = await request.formData();
  const email = form.get("email");
  const password = form.get("password");
  const token = form.get("token");

  // Validate input types
  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    typeof token !== "string"
  ) {
    session.flash("error", "Invalid form submission.");
    return redirect("/login", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }

  try {
    await validateRecaptchaToken(token);
    // Trim and check for empty values
    if (email.trim() === "" || password.trim() === "") {
      session.flash("error", "Email and password are required.");
      return redirect("/login", {
        headers: {
          "Set-Cookie": await commitSession(session),
        },
      });
    }

    const user = await validateCredentials({
      email,
      password,
    });

    session.set("user", user);

    // Login succeeded, send them to the home page.
    return redirect("/", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  } catch (error: unknown) {
    let errorMessage = "An unknown error occurred.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    session.flash("error", errorMessage);
    return redirect("/login", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }
}

function LoginForm({ loaderData }: Route.ComponentProps) {
  const { executeRecaptcha } = useGoogleReCaptcha();
  const fetcher = useFetcher();
  const formRef = useRef<HTMLFormElement>(null);

  const handleRegister = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      if (!executeRecaptcha || !formRef.current) {
        return;
      }
      const token = await executeRecaptcha("register");
      const formData = new FormData(formRef.current);
      formData.append("token", token);
      fetcher.submit(formData, { method: "POST" });
    },
    [executeRecaptcha, fetcher],
  );

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="shadow-md rounded-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">
          Sign in to your account
        </h1>

        {loaderData?.error && (
          <div className="mb-4 text-red-600 text-sm text-center">
            {loaderData.error}
          </div>
        )}

        <fetcher.Form
          ref={formRef}
          onSubmit={handleRegister}
          className="space-y-6"
        >
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <input
              type="password"
              name="password"
              id="password"
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={fetcher.state !== "idle"}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
            >
              Sign In
            </button>
          </div>
        </fetcher.Form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Login(props: Route.ComponentProps) {
  if (!RECAPTCHA_V3_SITE_KEY) {
    console.error("reCAPTCHA Site Key not found.");
    return <div>reCAPTCHA not configured.</div>;
  }
  return (
    <GoogleReCaptchaProvider reCaptchaKey={RECAPTCHA_V3_SITE_KEY}>
      <LoginForm {...props} />
    </GoogleReCaptchaProvider>
  );
}
