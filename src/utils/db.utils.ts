import pool from '../config/db';
import { QueryResult, QueryResultRow } from 'pg';


export async function query<T extends QueryResultRow>(
  sql: string,
  params?: (string | number | boolean | null)[]
): Promise<QueryResult<T>> {
  return pool.query<T>(sql, params);
}




export async function queryOne<T extends QueryResultRow>(
  sql: string,
  params?: (string | number | boolean | null)[]
): Promise<T | null> {
  const result = await pool.query<T>(sql, params);
  return result.rows[0] ?? null;
}




export async function queryMany<T extends QueryResultRow>(
  sql: string,
  params?: (string | number | boolean | null)[]
): Promise<T[]> {
  const result = await pool.query<T>(sql, params);
  return result.rows;
}
