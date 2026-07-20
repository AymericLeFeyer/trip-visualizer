import { nanoid } from 'nanoid';
import { db } from './db.ts';
import type { Trip, TripInput, TripSummary } from '../shared/types/trip.ts';

interface TripRow {
  id: string;
  data: string;
  created_at: string;
  updated_at: string;
}

const selectById = db.prepare('SELECT * FROM trips WHERE id = ?');
const selectAll = db.prepare('SELECT * FROM trips ORDER BY updated_at DESC');
const insertStmt = db.prepare(
  'INSERT INTO trips (id, data, created_at, updated_at) VALUES (?, ?, ?, ?)',
);
const updateStmt = db.prepare('UPDATE trips SET data = ?, updated_at = ? WHERE id = ?');
const deleteStmt = db.prepare('DELETE FROM trips WHERE id = ?');

function rowToTrip(row: TripRow): Trip {
  return JSON.parse(row.data) as Trip;
}

export function getTrip(id: string): Trip | null {
  const row = selectById.get(id) as unknown as TripRow | undefined;
  return row ? rowToTrip(row) : null;
}

export function listTrips(): TripSummary[] {
  const rows = selectAll.all() as unknown as TripRow[];
  return rows.map((row) => {
    const trip = rowToTrip(row);
    return {
      id: trip.id,
      title: trip.title,
      updatedAt: trip.updatedAt,
      stageCount: trip.stages.length,
    };
  });
}

export function createTrip(input: TripInput): Trip {
  const now = new Date().toISOString();
  const trip: Trip = {
    ...input,
    id: nanoid(10),
    createdAt: now,
    updatedAt: now,
  };
  insertStmt.run(trip.id, JSON.stringify(trip), now, now);
  return trip;
}

export function updateTrip(id: string, input: TripInput): Trip | null {
  const existing = getTrip(id);
  if (!existing) return null;
  const now = new Date().toISOString();
  const trip: Trip = {
    ...input,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: now,
  };
  updateStmt.run(JSON.stringify(trip), now, id);
  return trip;
}

export function deleteTrip(id: string): boolean {
  const result = deleteStmt.run(id);
  return Number(result.changes) > 0;
}
