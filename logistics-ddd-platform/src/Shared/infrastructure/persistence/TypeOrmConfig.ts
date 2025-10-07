import type { DataSourceOptions } from "typeorm";
import { DataSource } from "typeorm";
import { StockItemEntity } from '../../../Contexts/Inventory/StockItem/infrastructure/persistence/StockItemEntity';
import { PackageEntity } from '../../../Contexts/Logistics/Package/infrastructure/persistence/PackageEntity';

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

  // Check for test environment more explicitly
  const isTest = env("NODE_ENV") === "test" || env("TEST_DB") === "true" || process.env.NODE_ENV === "test";
  const isDevelopment = env("NODE_ENV") === "development" || (!env("NODE_ENV") && process.env.NODE_ENV !== "production");

  const common: Partial<DataSourceOptions> = {
    type,
    synchronize: isTest || isDevelopment, // Enable sync for tests and development, disable for production
    logging: env("DB_LOGGING", "false") === "true",
    entities: [
      StockItemEntity,
      PackageEntity,
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
      const host = env("DB_HOST", "localhost");
      const port = Number(env("DB_PORT", type === "postgres" ? "5432" : type === "mysql" || type === "mariadb" ? "3306" : type === "mssql" ? "1433" : "0"));
      const username = env("DB_USERNAME", "app")!;
      const password = env("DB_PASSWORD", "app")!;
      const database = env("DB_NAME", "app")!;
      
      return {
        ...common,
        type,
        host,
        port,
        username,
        password,
        database,
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

// Create and export a single AppDataSource instance
export const AppDataSource = new DataSource(getTypeOrmConfig());

// Convenience default export
export { getTypeOrmConfig as default };