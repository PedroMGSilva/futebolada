import pg, { Pool } from "pg";
import { config } from "~/.server/config";

pg.types.setTypeParser(1082, (val: string) => val);

const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.name,
});

export default pool;
