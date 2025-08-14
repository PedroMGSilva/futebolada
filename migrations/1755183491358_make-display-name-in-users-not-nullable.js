export const shorthands = undefined;

export const up = (pgm) => {
  pgm.alterColumn("users", "display_name", { notNull: true });
};

export function down(pgm) {}
