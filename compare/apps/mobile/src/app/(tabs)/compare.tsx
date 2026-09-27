import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from "react-native";
import { mobileStorage, type MobileStoredScenario } from "../../lib/storage";
import { formatCurrency } from "@bandinghidup/core";

export default function MobileCompareScreen() {
  const [scenarios, setScenarios] = useState<MobileStoredScenario[]>([]);

  useEffect(() => {
    mobileStorage.loadScenarios().then(setScenarios);
  }, []);

  const scenarioA = scenarios[0];
  const scenarioB = scenarios[1];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.brand}>⚖️ Dual-City Comparison</Text>
          <Text style={styles.title}>Compare Scenarios</Text>
          <Text style={styles.subtitle}>Side-by-side offline delta analysis</Text>
        </View>

        {scenarioA && scenarioB ? (
          <View style={styles.compareGrid}>
            <View style={styles.column}>
              <Text style={styles.cityName}>{scenarioA.cityName}</Text>
              <Text style={styles.pathway}>{scenarioA.pathway}</Text>
              <Text style={styles.amount}>
                {formatCurrency(scenarioA.result.monthlyBalance, scenarioA.country === "DE" ? "EUR" : "JPY", "en-US")}
              </Text>
            </View>

            <View style={styles.column}>
              <Text style={styles.cityName}>{scenarioB.cityName}</Text>
              <Text style={styles.pathway}>{scenarioB.pathway}</Text>
              <Text style={styles.amount}>
                {formatCurrency(scenarioB.result.monthlyBalance, scenarioB.country === "DE" ? "EUR" : "JPY", "en-US")}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Save at least 2 scenarios to compare them side-by-side.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#090d16" },
  content: { padding: 16 },
  header: { marginBottom: 20 },
  brand: { fontSize: 12, fontWeight: "bold", color: "#28906d" },
  title: { fontSize: 24, fontWeight: "bold", color: "#ffffff", marginTop: 4 },
  subtitle: { fontSize: 12, color: "rgba(255, 255, 255, 0.5)", marginTop: 2 },
  compareGrid: { flexDirection: "row", gap: 12 },
  column: { flex: 1, backgroundColor: "rgba(28, 46, 34, 0.6)", padding: 16, borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  cityName: { fontSize: 16, fontWeight: "bold", color: "#ffffff" },
  pathway: { fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 12 },
  amount: { fontSize: 16, fontWeight: "bold", color: "#28906d" },
  emptyCard: { backgroundColor: "rgba(255,255,255,0.03)", padding: 24, borderRadius: 16, alignItems: "center" },
  emptyText: { color: "rgba(255,255,255,0.5)", textAlign: "center", fontSize: 14 },
});
