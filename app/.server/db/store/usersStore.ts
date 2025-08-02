import pool from "~/.server/db/client";

type User = {
  id: string;
  email: string;
  name: string;
  password: string;
};

export async function getUser(email: string): Promise<User | null> {
  const result = await pool.query<User>(
    `
      SELECT
          u.id,
          u.email,
          u.name,
          u.password,
          u.created_at,
          u.updated_at
      FROM users u
      WHERE u.email = $1
    `,
    [email],
  );

  return result.rows[0] ?? null;
}

interface CreateUserInput {
  id: string;
  email: string;
  name: string;
  password: string;
}

export async function createUser(input: CreateUserInput): Promise<User> {
  try {
    const result = await pool.query<User>(
      `
      INSERT INTO users (id, email, name, password)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, name, password, created_at, updated_at
    `,
      [input.id, input.email, input.name, input.password],
    );
    return result.rows[0];
  } catch (err: unknown) {
    if (isPgUniqueViolationError(err)) {
      throw new Response("User already exists", { status: 404 });
    } else {
      throw new Response("Server error", { status: 500 });
    }
  }
}

function isPgUniqueViolationError(err: unknown): err is { code: string } {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: unknown }).code === "23505"
  );
}
