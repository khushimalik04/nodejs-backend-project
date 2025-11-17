import { db, pool } from '../../src/db';
import { sql } from 'drizzle-orm';

describe('Database Integration Tests (Node-Postgres + Drizzle)', () => {
  beforeAll(() => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.DATABASE_URL).toContain('test');
  });

  afterAll(async () => {
    await pool.end();
  });

  it('should connect to the test DB', async () => {
    const client = await pool.connect();
    expect(client).toBeDefined();
    client.release();
  });

  it('should run SELECT NOW()', async () => {
    const result = await db.execute(sql`SELECT NOW() as current_time`);

    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.rows[0]).toHaveProperty('current_time');
  });

  it('should check PostgreSQL version', async () => {
    const result = await db.execute(sql`SELECT version() as db_version`);

    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.rows[0].db_version).toContain('PostgreSQL');
  });

  it('should verify correct database name', async () => {
    const result = await db.execute(sql`SELECT current_database() AS db_name`);

    expect(result.rows.length).toBe(1);
    expect(result.rows[0].db_name).toBe('db_postgres_test');
  });

  it('should run multiple simple queries', async () => {
    const queries = [sql`SELECT 1 AS num`, sql`SELECT 'hello' AS str`, sql`SELECT TRUE AS bool`];

    for (const q of queries) {
      const result = await db.execute(q);
      expect(result.rows.length).toBeGreaterThan(0);
    }
  });

  it('should test connection settings', async () => {
    const result = await db.execute(sql`
      SELECT 
        current_setting('server_version') AS version,
        current_setting('server_encoding') AS encoding,
        current_setting('timezone') AS timezone
    `);

    const row = result.rows[0];

    expect(row).toHaveProperty('version');
    expect(row).toHaveProperty('encoding');
    expect(row).toHaveProperty('timezone');
  });

  it('should catch invalid query errors properly', async () => {
    await expect(db.execute(sql`SELECT * FROM some_nonexistent_table`)).rejects.toThrow();
  });

  it('should verify connection pool works (5 parallel queries)', async () => {
    const queries = Array.from({ length: 5 }, (_, i) => db.execute(sql`SELECT ${i} AS n, NOW() AS ts`));

    const results = await Promise.all(queries);

    expect(results).toHaveLength(5);

    results.forEach((result, i) => {
      expect(Number(result.rows[0].n)).toBe(i);
      expect(result.rows[0].ts).toBeDefined();
    });
  });
});
