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