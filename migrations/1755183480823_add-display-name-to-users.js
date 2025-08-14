export const shorthands = undefined;

export const up = (pgm) => {
  pgm.addColumn("users", {
    display_name: { type: "text" },
  });
};

export function down(pgm) {
  pgm.dropColumn("users", "display_name");
}
