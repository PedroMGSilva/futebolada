import { data, Link, redirect, useFetcher } from "react-router";
import { commitSession, getSession } from "~/.server/session";
import type { Route } from "./+types/register";
import {
  GoogleReCaptchaProvider,
  useGoogleReCaptcha,
} from "react-google-recaptcha-v3";
import { type FormEvent, useCallback, useRef } from "react";
import { validateRecaptchaToken } from "~/.server/domain/captcha";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { store } from "~/.server/db/operations";
import { config } from "~/.server/config";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));

  if (session.has("userId")) {
    // Redirect to the home page if they are already signed in.
    return redirect("/");
  }

  const recaptchaV3SiteKey = config.recaptchaV3.siteKey;

  return data(
    {
      recaptchaV3SiteKey: recaptchaV3SiteKey,
      error: session.get("error"),
    },
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
  const name = form.get("name");
  const password = form.get("password");
  const confirmPassword = form.get("confirmPassword");
  const token = form.get("token");

  if (
    typeof email !== "string" ||
    typeof name !== "string" ||
    typeof password !== "string" ||
    typeof confirmPassword !== "string" ||
    typeof token !== "string"
  ) {
    session.flash("error", "Invalid form submission.");
    return redirect("/register", {
      headers: { "Set-Cookie": await commitSession(session) },
    });
  }

  try {
    await validateRecaptchaToken(token);

    if (email.trim() === "" || name.trim() === "" || password.trim() === "") {
      session.flash("error", "Email, name, and password are required.");
      return redirect("/register", {
        headers: { "Set-Cookie": await commitSession(session) },
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      session.flash("error", "Invalid email address.");
      return redirect("/register", {
        headers: { "Set-Cookie": await commitSession(session) },
      });
    }

    if (password !== confirmPassword) {
      session.flash("error", "Passwords do not match.");
      return redirect("/register", {
        headers: { "Set-Cookie": await commitSession(session) },
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const userId = uuidv4();
    const playerId = uuidv4();

    const { user } = await store.users.createUserAndPlayer({
      userId,
      playerId,
      email,
      name,
      password: hashedPassword,
      authProvider: "local",
      authProviderId: null,
    });

    session.set("userId", user.id);

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
    return redirect("/register", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }
}

function RegisterForm({ loaderData }: Route.ComponentProps) {
  const { executeRecaptcha } = useGoogleReCaptcha();
  const fetcher = useFetcher();
  const formRef = useRef<HTMLFormElement>(null);

  const { error } = loaderData;

  const handleRegister = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      if (!executeRecaptcha || !formRef.current) {
        return;
      }
      const token = await executeRecaptcha("register");
      const formData = new FormData(formRef.current);
      formData.append("token", token);
      await fetcher.submit(formData, { method: "POST" });
    },
    [executeRecaptcha, fetcher],
  );

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="shadow-md rounded-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">
          Create an account
        </h1>

        {error && (
          <div className="mb-4 text-red-600 text-sm text-center">{error}</div>
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
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 "
              required
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium">
              Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 "
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
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium"
            >
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              id="confirmPassword"
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
              Sign Up
            </button>
          </div>
        </fetcher.Form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Register(props: Route.ComponentProps) {
  const { recaptchaV3SiteKey } = props.loaderData;
  if (!recaptchaV3SiteKey) {
    console.error("reCAPTCHA Site Key not found.");
    return <div>reCAPTCHA not configured.</div>;
  }
  return (
    <GoogleReCaptchaProvider reCaptchaKey={recaptchaV3SiteKey}>
      <RegisterForm {...props} />
    </GoogleReCaptchaProvider>
  );
}
