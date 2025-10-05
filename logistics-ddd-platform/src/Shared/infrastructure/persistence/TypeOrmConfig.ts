import type { DataSourceOptions } from "typeorm";

/**
 * Supported database drivers for TypeORM
 */
type SupportedDriver = "postgres" | "mysql" | "mariadb" | "sqlite" | "mssql";

/**
 * Utility to read environment variables with an optional fallback
 */
function env(name: string, fallback?: string): string | undefined {
  const v = process.env[name];
  return v === undefined || v === "" ? fallback : v;
}

/**
 * Returns a TypeORM DataSourceOptions object based on environment variables.
 *
 * Supports multiple database types and sets sensible defaults.
 */
export function getTypeOrmConfig(): DataSourceOptions {
  const type = (env("DB_TYPE", "postgres") as SupportedDriver) as DataSourceOptions["type"];

  const common: Partial<DataSourceOptions> = {
    type,
    synchronize: false, // avoid auto-sync in production
    logging: env("DB_LOGGING", "false") === "true",
    entities: [
      // Convention: TypeORM entities under infrastructure/persistence/typeorm
      "src/**/infrastructure/persistence/typeorm/**/*.{ts,js}",
      // Fallback: any file ending with Entity
      "src/**/*Entity.{ts,js}",
    ],
    migrations: [
      "src/**/infrastructure/persistence/typeorm/migrations/**/*.{ts,js}",
    ],
  };

  switch (type) {
    case "postgres":
    case "mysql":
    case "mariadb":
    case "mssql": {
      return {
        ...common,
        type,
        host: env("DB_HOST", "localhost"),
        port: Number(env("DB_PORT", type === "postgres" ? "5432" : type === "mysql" || type === "mariadb" ? "3306" : type === "mssql" ? "1433" : "0")),
        username: env("DB_USERNAME", "app"),
        password: env("DB_PASSWORD", "app"),
        database: env("DB_NAME", "app"),
      } as DataSourceOptions;
    }
    case "sqlite": {
      return {
        ...common,
        type,
        database: env("DB_SQLITE_PATH", ".data/dev.sqlite")!,
      } as DataSourceOptions;
    }
    default:
      throw new Error(`Unsupported DB_TYPE: ${String(type)}`);
  }
}

// Convenience default export
const config: DataSourceOptions = getTypeOrmConfig();
export default config;
