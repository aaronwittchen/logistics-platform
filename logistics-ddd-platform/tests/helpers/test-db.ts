// tests/helpers/test-db.ts
import "reflect-metadata";
import { config as loadEnv } from "dotenv";
import { DataSource } from "typeorm";
import ormConfig from "../../src/Shared/infrastructure/persistence/TypeOrmConfig";

loadEnv({ path: ".env.test" });

export const testDataSource = new DataSource(ormConfig);

export async function initTestDb() {
  if (!testDataSource.isInitialized) await testDataSource.initialize();
  // optionally run migrations if you use them:
  // await testDataSource.runMigrations();
}

export async function resetTestDb() {
  const entities = testDataSource.entityMetadatas;
  for (const e of entities) {
    await testDataSource.createQueryRunner().query(`TRUNCATE "${e.tableName}" RESTART IDENTITY CASCADE;`);
  }
}

export async function closeTestDb() {
  if (testDataSource.isInitialized) await testDataSource.destroy();
}