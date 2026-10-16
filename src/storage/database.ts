import * as SQLite from 'expo-sqlite';
import { Mountain, Trip, GpsPoint } from '../core/types';
import { SAMPLE_MOUNTAINS } from '../data/sample';
import { calculateTripTrack, SegmentedSample } from '../gps/route';

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
  const row2 = await connection.getFirstAsync<{user_version:number}>('PRAGMA user_version');
  if ((row2?.user_version??0)<2) {
    await connection.execAsync(
      'ALTER TABLE trips ADD COLUMN gpsEpoch INTEGER NOT NULL DEFAULT 0;' +
      'CREATE TABLE IF NOT EXISTS gps_samples ('+
      'tripId TEXT NOT NULL, epoch INTEGER NOT NULL, timestamp INTEGER NOT NULL, '+
      'latitude REAL NOT NULL, longitude REAL NOT NULL, accuracyM REAL NOT NULL, '+
      'PRIMARY KEY(tripId,timestamp,latitude,longitude), '+
      'FOREIGN KEY(tripId) REFERENCES trips(id) ON DELETE CASCADE);' +
      'CREATE INDEX IF NOT EXISTS idx_gps_trip ON gps_samples(tripId,timestamp);' +
      'PRAGMA user_version = 2;'
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
export async function findTrip(id:string):Promise<Trip|null> {
  return (await db()).getFirstAsync<Trip>('SELECT * FROM trips WHERE id = ?',id);
}
/** Atomic upsert: repeat saves cannot duplicate a trip. */
export async function saveTrip(trip:Trip):Promise<void> {
  const c=await db();
  await c.withExclusiveTransactionAsync(async tx=>{
    await tx.runAsync(
      'INSERT INTO trips (id,source,status,startedAt,endedAt,pausedAt,manualPausedMs,autoRestMs,distanceM,gpsGoodPoints,gpsEpoch,mountainId,note) '+
      'VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET '+
      'source=excluded.source,status=excluded.status,startedAt=excluded.startedAt,endedAt=excluded.endedAt,'+
      'pausedAt=excluded.pausedAt,manualPausedMs=excluded.manualPausedMs,'+
      'distanceM=CASE WHEN excluded.source=\'gps\' THEN trips.distanceM ELSE excluded.distanceM END,'+
      'autoRestMs=CASE WHEN excluded.source=\'gps\' THEN trips.autoRestMs ELSE excluded.autoRestMs END,'+
      'gpsGoodPoints=CASE WHEN excluded.source=\'gps\' THEN trips.gpsGoodPoints ELSE excluded.gpsGoodPoints END,'+
      'gpsEpoch=excluded.gpsEpoch,'+
      'mountainId=excluded.mountainId,note=excluded.note',
      trip.id,trip.source,trip.status,trip.startedAt,trip.endedAt,trip.pausedAt,
      trip.manualPausedMs,trip.autoRestMs,trip.distanceM,trip.gpsGoodPoints,
      trip.gpsEpoch??0,trip.mountainId,trip.note
    );
  });
}
export async function deleteTrip(id:string):Promise<void> {
  await (await db()).runAsync('DELETE FROM trips WHERE id = ?',id);
}
export async function latestGpsPoint(id:string):Promise<GpsPoint|null> {
  return (await db()).getFirstAsync<GpsPoint>(
    'SELECT latitude,longitude,accuracyM,timestamp FROM gps_samples WHERE tripId=? ORDER BY timestamp DESC LIMIT 1',id);
}
export async function allGpsPoints(id:string):Promise<SegmentedSample[]> {
  const rows=await (await db()).getAllAsync<SegmentedSample>(
    'SELECT latitude,longitude,accuracyM,timestamp,epoch FROM gps_samples WHERE tripId=? ORDER BY timestamp',id);
  return rows;
}
/** One SQLite transaction for the raw sample and computed metrics.
 * Repeated callbacks use INSERT OR IGNORE. No GPS samples on paused or finished trips.
 */
export async function ingestGpsSample(tripId:string,point:GpsPoint):Promise<boolean> {
  const c=await db();
  let inserted=false;
  await c.withExclusiveTransactionAsync(async tx=>{
    const trip=await tx.getFirstAsync<Trip>('SELECT * FROM trips WHERE id=?',tripId);
    if(!trip||trip.source!=='gps'||trip.status!=='recording')return;
    const result=await tx.runAsync(
      'INSERT OR IGNORE INTO gps_samples(tripId,epoch,timestamp,latitude,longitude,accuracyM) VALUES(?,?,?,?,?,?)',
      tripId,trip.gpsEpoch??0,point.timestamp,point.latitude,point.longitude,point.accuracyM);
    if(result.changes===0)return;
    const all=await tx.getAllAsync<SegmentedSample>(
      'SELECT latitude,longitude,accuracyM,timestamp,epoch FROM gps_samples WHERE tripId=? ORDER BY timestamp',tripId);
    const metrics=calculateTripTrack(all);
    await tx.runAsync('UPDATE trips SET distanceM=?,autoRestMs=?,gpsGoodPoints=? WHERE id=?',
      metrics.distanceM,metrics.autoRestMs,metrics.gpsGoodPoints,tripId);
    inserted=true;
  });
  return inserted;
}
