"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchExchangeRates,
  type ReferenceCurrency,
  type ExchangeRates,
} from "./exchangeRate";

interface CurrencyContextType {
  refCurrency: ReferenceCurrency;
  setRefCurrency: (currency: ReferenceCurrency) => void;
  exchangeRates: ExchangeRates | undefined;
  isLoading: boolean;
  customOverrides: Record<string, number> | null;
  updateCustomRate: (currency: string, rateRelativeToEur: number) => void;
  resetToOfficialRates: () => void;
  isCustomized: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_REF_CURR = "bandinghidup_ref_currency";
const LOCAL_STORAGE_KEY_CUSTOM_RATES = "bandinghidup_custom_exchange_rates";

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [refCurrency, setRefCurrencyState] = useState<ReferenceCurrency>("EUR");
  const [customOverrides, setCustomOverrides] = useState<Record<string, number> | null>(null);

  // Load persisted preferences from localStorage on mount
  useEffect(() => {
    try {
      const savedCurr = localStorage.getItem(LOCAL_STORAGE_KEY_REF_CURR) as ReferenceCurrency | null;
      if (savedCurr && ["EUR", "JPY", "IDR", "USD"].includes(savedCurr)) {
        setRefCurrencyState(savedCurr);
      }

      const savedOverrides = localStorage.getItem(LOCAL_STORAGE_KEY_CUSTOM_RATES);
      if (savedOverrides) {
        setCustomOverrides(JSON.parse(savedOverrides));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const { data: rawExchangeRates, isLoading } = useQuery<ExchangeRates>({
    queryKey: ["exchangeRates"],
    queryFn: fetchExchangeRates,
    staleTime: 1000 * 60 * 60, // 1 hr
  });

  // Merge official rates with custom user overrides if present
  const exchangeRates: ExchangeRates | undefined = React.useMemo(() => {
    if (!rawExchangeRates) return undefined;
    if (!customOverrides || Object.keys(customOverrides).length === 0) {
      return rawExchangeRates;
    }
    return {
      ...rawExchangeRates,
      rates: {
        ...rawExchangeRates.rates,
        ...customOverrides,
      },
    };
  }, [rawExchangeRates, customOverrides]);

  function setRefCurrency(curr: ReferenceCurrency) {
    setRefCurrencyState(curr);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_REF_CURR, curr);
    } catch {}
  }

  function updateCustomRate(currency: string, rateRelativeToEur: number) {
    const updated = {
      ...(customOverrides ?? {}),
      [currency]: rateRelativeToEur,
    };
    setCustomOverrides(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_CUSTOM_RATES, JSON.stringify(updated));
    } catch {}
  }

  function resetToOfficialRates() {
    setCustomOverrides(null);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY_CUSTOM_RATES);
    } catch {}
  }

  return (
    <CurrencyContext.Provider
      value={{
        refCurrency,
        setRefCurrency,
        exchangeRates,
        isLoading,
        customOverrides,
        updateCustomRate,
        resetToOfficialRates,
        isCustomized: !!customOverrides && Object.keys(customOverrides).length > 0,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
