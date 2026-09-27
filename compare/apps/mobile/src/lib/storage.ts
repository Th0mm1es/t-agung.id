/**
 * BandingHidup Mobile — Offline Scenario Storage (AsyncStorage)
 *
 * Persists scenarios 100% locally on device with zero internet connection requirement.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ScenarioResult } from "@bandinghidup/core";

export interface MobileStoredScenario {
  id: string;
  label: string;
  country: string;
  cityName: string;
  pathway: string;
  savedAt: string;
  result: ScenarioResult;
}

const MOBILE_STORAGE_KEY = "@bandinghidup/scenarios_v1";

export const mobileStorage = {
  async saveScenario(result: ScenarioResult, customLabel?: string): Promise<MobileStoredScenario> {
    const existing = await this.loadScenarios();

    const stored: MobileStoredScenario = {
      id: result.input.id,
      label: customLabel ?? `${result.input.cityName} — ${result.input.pathway}`,
      country: result.input.country,
      cityName: result.input.cityName,
      pathway: result.input.pathway,
      savedAt: new Date().toISOString(),
      result,
    };

    const updated = [stored, ...existing.filter((s) => s.id !== stored.id)];
    await AsyncStorage.setItem(MOBILE_STORAGE_KEY, JSON.stringify(updated));
    return stored;
  },

  async loadScenarios(): Promise<MobileStoredScenario[]> {
    try {
      const raw = await AsyncStorage.getItem(MOBILE_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return parsed.sort(
        (a: MobileStoredScenario, b: MobileStoredScenario) =>
          new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
      );
    } catch {
      return [];
    }
  },

  async getScenarioById(id: string): Promise<MobileStoredScenario | undefined> {
    const scenarios = await this.loadScenarios();
    return scenarios.find((s) => s.id === id);
  },

  async deleteScenario(id: string): Promise<void> {
    const existing = await this.loadScenarios();
    const updated = existing.filter((s) => s.id !== id);
    await AsyncStorage.setItem(MOBILE_STORAGE_KEY, JSON.stringify(updated));
  },

  async clearAllScenarios(): Promise<void> {
    await AsyncStorage.removeItem(MOBILE_STORAGE_KEY);
  },
};
