export const shorthands = undefined;

export const up = async (pgm) => {
  await pgm.db.query(`UPDATE users SET display_name = name`);
};

export function down(pgm) {}
