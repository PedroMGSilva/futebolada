export const shorthands = undefined;

export const up = (pgm) => {
  pgm.createType("team_color", ["black", "white"]);

  pgm.addColumns("players_enrolled", {
    team: {
      type: "team_color",
    },
  });
};

export async function down(pgm) {
  pgm.dropColumns("players_enrolled", ["team"]);

  pgm.dropType("team_color");
}
