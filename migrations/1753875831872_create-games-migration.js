export const shorthands = undefined;

export const up = (pgm) => {
    pgm.createTable('games', {
        id: {
            type: 'uuid',
            primaryKey: true,
        },
        date: {
            type: 'date',
            notNull: true,
        },
        start_time: {
            type: 'time',
            notNull: true,
        },
        end_time: {
            type: 'time',
            notNull: true,
        },
        location: {
            type: 'text',
            notNull: true,
        },
        max_players: {
            type: 'integer',
            notNull: true,
        },
        created_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
        updated_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
    });
};

export async function down(pgm) {
    pgm.dropTable('games');
}
