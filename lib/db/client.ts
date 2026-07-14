import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import { getLibSqlConfig } from "./env";
import * as schema from "./schema";

const libsqlClient = createClient(getLibSqlConfig());

export const db = drizzle(libsqlClient, { schema });
