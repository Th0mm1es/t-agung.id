import React from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from "react-native";
import { SUPPORTED_LOCALES } from "@bandinghidup/core";

export default function MobileSettingsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.brand}>⚙️ App Settings</Text>
          <Text style={styles.title}>Preferences & Legal</Text>
        </View>

        {/* Legal Disclaimer Box */}
        <View style={styles.card}>
          <Text style={styles.disclaimerTitle}>⚠️ Non-Binding Legal Disclaimer</Text>
          <Text style={styles.disclaimerText}>
            BandingHidup provides planning estimates based on user inputs and available benchmarks. It is not legal, tax, payroll, visa, or financial advice. Verify your contract terms and official visa requirements before making decisions.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>App Version</Text>
          <Text style={styles.cardValue}>1.0.0 (Stage 5 Native Expansion)</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Supported Locales</Text>
          <Text style={styles.cardValue}>{SUPPORTED_LOCALES.join(" • ").toUpperCase()}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#090d16" },
  content: { padding: 16, gap: 16 },
  header: { marginBottom: 8 },
  brand: { fontSize: 12, fontWeight: "bold", color: "#28906d" },
  title: { fontSize: 24, fontWeight: "bold", color: "#ffffff", marginTop: 4 },
  card: { backgroundColor: "rgba(28, 46, 34, 0.5)", padding: 16, borderRadius: 16, borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.1)", gap: 6 },
  disclaimerTitle: { color: "#ffa528", fontWeight: "bold", fontSize: 14 },
  disclaimerText: { color: "rgba(255, 255, 255, 0.6)", fontSize: 12, lineHeight: 18, fontStyle: "italic" },
  cardTitle: { color: "rgba(255, 255, 255, 0.5)", fontSize: 12 },
  cardValue: { color: "#ffffff", fontWeight: "bold", fontSize: 14 },
});
