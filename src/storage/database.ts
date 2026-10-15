import * as SQLite from 'expo-sqlite';
import { Mountain, Trip } from '../core/types';
import { SAMPLE_MOUNTAINS } from '../data/sample';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;
export async function db(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) dbPromise = openDb().catch(error => { dbPromise = null; throw error; });
  return dbPromise;
}
async function openDb() {
  const connection = await SQLite.openDatabaseAsync('mountain-journal.db');
  await connection.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const row = await connection.getFirstAsync<{ user_version:number }>('PRAGMA user_version');
  if ((row?.user_version ?? 0) < 1) {
    await connection.execAsync(
      'CREATE TABLE IF NOT EXISTS mountains (' +
      'id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, region TEXT NOT NULL, ' +
      'official100 INTEGER NOT NULL DEFAULT 0, officialVerified INTEGER NOT NULL DEFAULT 0);' +
      'CREATE TABLE IF NOT EXISTS trips (' +
      'id TEXT PRIMARY KEY NOT NULL, source TEXT NOT NULL, status TEXT NOT NULL, ' +
      'startedAt INTEGER NOT NULL, endedAt INTEGER, pausedAt INTEGER, ' +
      'manualPausedMs INTEGER NOT NULL DEFAULT 0, autoRestMs INTEGER NOT NULL DEFAULT 0,' +
      'distanceM REAL NOT NULL DEFAULT 0, gpsGoodPoints INTEGER NOT NULL DEFAULT 0, ' +
      'mountainId TEXT, note TEXT NOT NULL DEFAULT "",' +
      'FOREIGN KEY (mountainId) REFERENCES mountains(id));' +
      'PRAGMA user_version = 1;'
    );
  }
  await connection.withExclusiveTransactionAsync(async tx => {
    for (const m of SAMPLE_MOUNTAINS) {
      await tx.runAsync('INSERT OR IGNORE INTO mountains (id,name,region,official100,officialVerified) VALUES (?,?,?,?,?)',
        m.id, m.name, m.region, Number(m.official100), Number(m.officialVerified));
    }
  });
  return connection;
}
type MountainRow = {id:string;name:string;region:string;official100:number;officialVerified:number};
export async function allMountains():Promise<Mountain[]> {
  const rows = await (await db()).getAllAsync<MountainRow>('SELECT * FROM mountains ORDER BY name');
  return rows.map(r=>({id:r.id,name:r.name,region:r.region,official100:!!r.official100,officialVerified:!!r.officialVerified}));
}
export async function createMountain(m:Mountain):Promise<void> {
  await (await db()).runAsync(
    'INSERT INTO mountains (id,name,region,official100,officialVerified) VALUES (?,?,?,?,?)',
    m.id,m.name,m.region,Number(m.official100),Number(m.officialVerified));
}
export async function allTrips():Promise<Trip[]> {
  return (await db()).getAllAsync<Trip>('SELECT * FROM trips ORDER BY startedAt DESC');
}
export async function findTrip(id:string):Promise<Trip | null> {
  return (await db()).getFirstAsync<Trip>('SELECT * FROM trips WHERE id = ?',id);
}
/** Atomic upsert: repeat saves cannot duplicate a trip. */
export async function saveTrip(trip:Trip):Promise<void> {
  const c = await db();
  await c.withExclusiveTransactionAsync(async tx => {
    await tx.runAsync(
      'INSERT INTO trips (id,source,status,startedAt,endedAt,pausedAt,manualPausedMs,autoRestMs,distanceM,gpsGoodPoints,mountainId,note) '+
      'VALUES (?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET '+
      'source=excluded.source,status=excluded.status,startedAt=excluded.startedAt,endedAt=excluded.endedAt,'+
      'pausedAt=excluded.pausedAt,manualPausedMs=excluded.manualPausedMs,autoRestMs=excluded.autoRestMs,'+
      'distanceM=excluded.distanceM,gpsGoodPoints=excluded.gpsGoodPoints,mountainId=excluded.mountainId,note=excluded.note',
      trip.id,trip.source,trip.status,trip.startedAt,trip.endedAt,trip.pausedAt,trip.manualPausedMs,
      trip.autoRestMs,trip.distanceM,trip.gpsGoodPoints,trip.mountainId,trip.note
    );
  });
}
export async function deleteTrip(id:string):Promise<void> {
  await (await db()).runAsync('DELETE FROM trips WHERE id = ?',id);
}
