/**
 * BandingHidup — Anonymous Scenario Storage (IndexedDB)
 *
 * Persists user scenarios locally in the browser with no authentication.
 * Uses the `idb` library for a typed, Promise-based IndexedDB API.
 *
 * Database: "bandinghidup-db" v1
 * Object Store: "scenarios"
 */

import { openDB, type IDBPDatabase } from "idb";
import type { ScenarioResult } from "@bandinghidup/core";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StoredScenario {
  id: string;
  label: string;
  country: string;
  cityName: string;
  pathway: string;
  savedAt: string;   // ISO timestamp
  result: ScenarioResult;
}

interface BandingHidupDB {
  scenarios: {
    key: string;
    value: StoredScenario;
    indexes: { "by-savedAt": string; "by-country": string };
  };
}

// ─── DB Setup ─────────────────────────────────────────────────────────────────

const DB_NAME = "bandinghidup-db";
const DB_VERSION = 1;

async function getDB(): Promise<IDBPDatabase<BandingHidupDB>> {
  return openDB<BandingHidupDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("scenarios")) {
        const store = db.createObjectStore("scenarios", { keyPath: "id" });
        store.createIndex("by-savedAt", "savedAt", { unique: false });
        store.createIndex("by-country", "country", { unique: false });
      }
    },
  });
}

// ─── Storage Actions ──────────────────────────────────────────────────────────

/**
 * Save a scenario result to IndexedDB.
 * Overwrites if the same ID exists.
 */
export async function saveScenario(
  result: ScenarioResult,
  customLabel?: string
): Promise<StoredScenario> {
  const db = await getDB();

  const stored: StoredScenario = {
    id: result.input.id,
    label: customLabel ?? result.input.scenarioLabel ?? `${result.input.cityName} — ${result.input.pathway}`,
    country: result.input.country,
    cityName: result.input.cityName,
    pathway: result.input.pathway,
    savedAt: new Date().toISOString(),
    result,
  };

  await db.put("scenarios", stored);
  return stored;
}

/**
 * Load all saved scenarios, sorted by most recently saved first.
 */
export async function loadScenarios(): Promise<StoredScenario[]> {
  const db = await getDB();
  const all = await db.getAll("scenarios");
  return all.sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
  );
}

/**
 * Load a single scenario by ID.
 * Returns undefined if not found.
 */
export async function getScenarioById(
  id: string
): Promise<StoredScenario | undefined> {
  const db = await getDB();
  return db.get("scenarios", id);
}

/**
 * Delete a scenario by ID.
 */
export async function deleteScenario(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("scenarios", id);
}

/**
 * Delete all saved scenarios (clear all).
 */
export async function clearAllScenarios(): Promise<void> {
  const db = await getDB();
  await db.clear("scenarios");
}

/**
 * Count total saved scenarios.
 */
export async function countScenarios(): Promise<number> {
  const db = await getDB();
  return db.count("scenarios");
}
