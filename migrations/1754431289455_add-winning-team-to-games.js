export const shorthands = undefined;

export const up = (pgm) => {
  pgm.createType("winning_team_type", ["white", "black", "draw"]);
  pgm.addColumns("games", {
    winning_team: {
      type: "winning_team_type",
    },
  });
};

export async function down(pgm) {
  pgm.dropColumns("games", ["winning_team"]);
  pgm.dropType("winning_team_type");
}
