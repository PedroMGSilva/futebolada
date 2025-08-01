import pool from "~/.server/db/client";

interface Credentials {
  username: string;
  password: string;
}

type User = {
  id: string;
  username: string;
  password: string;
};

export async function getUser(username: String): Promise<User | null> {
  const result = await pool.query<User>(`
      SELECT
          u.id,
          u.username,
          u.password,
          u.created_at,
          u.updated_at
      FROM users u
      WHERE u.username = $1
    `,
    [username]
  );

  return result.rows[0] ?? null;
}

interface CreateUserInput {
  id: string;
  username: string;
  password: string;
}

export async function createUser(input: CreateUserInput): Promise<User> {
  try {
    const result = await pool.query<User>(`
      INSERT INTO users (id, username, password)
      VALUES ($1, $2, $3)
      RETURNING id, username, password, created_at, updated_at
    `,
      [input.id, input.username, input.password],
    );
    return result.rows[0]
  } catch (err: unknown) {
    if (isPgUniqueViolationError(err)) {
      throw new Response("User already exists", { status: 404 });
    } else {
      throw new Response("Server error", { status: 500 });
    }
  }
}

function isPgUniqueViolationError(err: unknown): err is { code: string } {
  return typeof err === 'object' && err !== null && 'code' in err && (err as any).code === '23505';
}