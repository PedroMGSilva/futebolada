import pool from "~/.server/db/client";

export async function getPlayerEnrolledById(id: string) {
  const res = await pool.query(
    `SELECT * FROM players_enrolled WHERE id = $1 LIMIT 1`,
    [id]
  );

  if (res.rowCount === 0) return null;

  return {
    id: res.rows[0].id,
    gameId: res.rows[0].game_id,
    playerId: res.rows[0].player_id,
    position: res.rows[0].position,
    createdBy: res.rows[0].created_by,
  };
}