import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { formatCurrency } from "@bandinghidup/core";
import { DiagnosticBadge } from "./DiagnosticBadge";
import type { MobileStoredScenario } from "../lib/storage";

interface ScenarioCardProps {
  scenario: MobileStoredScenario;
  onPress?: () => void;
  onDelete?: () => void;
}

export function ScenarioCard({ scenario, onPress, onDelete }: ScenarioCardProps) {
  const { result } = scenario;
  const currency = result.input.country === "DE" ? "EUR" : "JPY";
  const isPositive = result.monthlyBalance >= 0n;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{scenario.cityName}</Text>
          <Text style={styles.subtitle}>{scenario.pathway}</Text>
        </View>
        <DiagnosticBadge level={result.overallSeverity} />
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <Text style={styles.label}>Monthly Net Pay</Text>
        <Text style={styles.valueNet}>
          {formatCurrency(result.income.netMonthly, currency, "en-US")}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Monthly Balance</Text>
        <Text style={[styles.valueBalance, isPositive ? styles.positive : styles.negative]}>
          {isPositive ? "+" : "- "}
          {formatCurrency(result.monthlyBalance < 0n ? result.monthlyBalance * -1n : result.monthlyBalance, currency, "en-US")}
        </Text>
      </View>

      {onDelete && (
        <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(28, 46, 34, 0.6)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  subtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.5)",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginVertical: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
  },
  valueNet: {
    fontSize: 14,
    fontWeight: "600",
    color: "#28906d",
  },
  valueBalance: {
    fontSize: 16,
    fontWeight: "bold",
  },
  positive: {
    color: "#4ade80",
  },
  negative: {
    color: "#f87171",
  },
  deleteBtn: {
    marginTop: 10,
    alignSelf: "flex-end",
  },
  deleteText: {
    fontSize: 12,
    color: "#f87171",
  },
});
