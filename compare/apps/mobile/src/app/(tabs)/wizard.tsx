import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from "react-native";
import { computeScenario, formatCurrency, type CountryCode, type PathwayCode, type HousingType, type LifestyleProfile } from "@bandinghidup/core";
import { mobileStorage } from "../../lib/storage";
import { DiagnosticBadge } from "../../components/DiagnosticBadge";

export default function MobileWizardScreen() {
  const [step, setStep] = useState(1);

  // Input states
  const [country, setCountry] = useState<CountryCode>("DE");
  const [cityName, setCityName] = useState("Stuttgart");
  const [pathway, setPathway] = useState<PathwayCode>("ausbildung");
  const [grossMonthly, setGrossMonthly] = useState("1050");
  const [housingType, setHousingType] = useState<HousingType>("shared_room");
  const [monthlyRent, setMonthlyRent] = useState("450");
  const [lifestyle, setLifestyle] = useState<LifestyleProfile>("realistic_newcomer");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const currency = country === "DE" ? "EUR" : "JPY";

  // Compute live result in Step 7
  const scenarioResult = React.useMemo(() => {
    if (step !== 7) return null;
    const grossMinor = currency === "EUR" ? BigInt(Math.round(parseFloat(grossMonthly || "0") * 100)) : BigInt(Math.round(parseFloat(grossMonthly || "0")));
    const rentMinor = currency === "EUR" ? BigInt(Math.round(parseFloat(monthlyRent || "0") * 100)) : BigInt(Math.round(parseFloat(monthlyRent || "0")));

    return computeScenario({
      id: `mobile-${Date.now()}`,
      createdAt: new Date().toISOString(),
      country,
      cityId: "city-123",
      cityName,
      pathway,
      grossMonthlyMinorUnits: grossMinor,
      ausbildungTrainingYear: 1,
      housingType,
      monthlyRentMinorUnits: rentMinor,
      isEmployerProvidedHousing: false,
      availableSavingsMinorUnits: currency === "EUR" ? 200000n : 300000n,
      lifestyleProfile: lifestyle,
      relocationInput: {
        depositMonths: 2,
        keyMoneyMonths: country === "JP" ? 1 : 0,
        agencyFeeMinorUnits: 0n,
        setupCushionMinorUnits: currency === "EUR" ? 50000n : 50000n,
        initialTravelMinorUnits: currency === "EUR" ? 150000n : 150000n,
      },
    });
  }, [step, country, cityName, pathway, grossMonthly, housingType, monthlyRent, lifestyle]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.stepTitle}>Step {step} of 7</Text>
          <Text style={styles.title}>
            {step === 1 ? "Choose Destination" : step === 2 ? "Select Pathway" : step === 3 ? "Income & Stipend" : step === 4 ? "Housing & Rent" : step === 5 ? "Lifestyle Profile" : step === 6 ? "Review & Cost Basket" : "Simulation Results"}
          </Text>
        </View>

        {step === 1 && (
          <View style={styles.stepContainer}>
            <TouchableOpacity style={[styles.optionCard, country === "DE" && styles.selectedCard]} onPress={() => { setCountry("DE"); setCityName("Stuttgart"); }}>
              <Text style={styles.optionEmoji}>🇩🇪</Text>
              <Text style={styles.optionText}>Germany (Stuttgart / Berlin / Munich)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.optionCard, country === "JP" && styles.selectedCard]} onPress={() => { setCountry("JP"); setCityName("Tokyo"); }}>
              <Text style={styles.optionEmoji}>🇯🇵</Text>
              <Text style={styles.optionText}>Japan (Tokyo / Nagoya / Osaka)</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            {(["ausbildung", "technical_intern", "student", "fresh_grad"] as PathwayCode[]).map((p) => (
              <TouchableOpacity key={p} style={[styles.optionCard, pathway === p && styles.selectedCard]} onPress={() => setPathway(p)}>
                <Text style={styles.optionText}>{p.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.inputLabel}>Monthly Gross Income ({currency})</Text>
            <TouchableOpacity style={styles.inputBox}>
              <Text style={styles.inputText}>{grossMonthly} {currency}</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 4 && (
          <View style={styles.stepContainer}>
            <Text style={styles.inputLabel}>Monthly Housing Rent ({currency})</Text>
            <TouchableOpacity style={styles.inputBox}>
              <Text style={styles.inputText}>{monthlyRent} {currency}</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 5 && (
          <View style={styles.stepContainer}>
            {(["minimum_viable", "realistic_newcomer", "comfortable"] as LifestyleProfile[]).map((l) => (
              <TouchableOpacity key={l} style={[styles.optionCard, lifestyle === l && styles.selectedCard]} onPress={() => setLifestyle(l)}>
                <Text style={styles.optionText}>{l.replace("_", " ").toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {step === 6 && (
          <View style={styles.stepContainer}>
            <Text style={styles.infoText}>Review line-item expense baselines. Calculated 100% locally using @bandinghidup/core engine.</Text>
          </View>
        )}

        {step === 7 && scenarioResult && (
          <View style={styles.stepContainer}>
            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>Monthly Cash Flow Balance</Text>
              <Text style={[styles.resultValue, scenarioResult.monthlyBalance >= 0n ? styles.positive : styles.negative]}>
                {formatCurrency(scenarioResult.monthlyBalance, currency, "en-US")}
              </Text>
              <DiagnosticBadge level={scenarioResult.overallSeverity} />
            </View>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={async () => {
                await mobileStorage.saveScenario(scenarioResult);
                setSavedSuccess(true);
              }}
            >
              <Text style={styles.saveBtnText}>{savedSuccess ? "✓ Saved to Device" : "💾 Save to Device"}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Controls */}
        <View style={styles.navRow}>
          {step > 1 && (
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(step - 1)}>
              <Text style={styles.btnText}>← Back</Text>
            </TouchableOpacity>
          )}
          {step < 7 && (
            <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(step + 1)}>
              <Text style={styles.btnText}>Continue →</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#090d16" },
  content: { padding: 16 },
  header: { marginBottom: 20 },
  stepTitle: { fontSize: 12, color: "#28906d", fontWeight: "bold" },
  title: { fontSize: 22, fontWeight: "bold", color: "#ffffff", marginTop: 4 },
  stepContainer: { gap: 12, marginBottom: 24 },
  optionCard: { backgroundColor: "rgba(28, 46, 34, 0.5)", padding: 16, borderRadius: 12, borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.1)", flexDirection: "row", alignItems: "center", gap: 12 },
  selectedCard: { borderColor: "#28906d", backgroundColor: "rgba(40, 144, 109, 0.2)" },
  optionEmoji: { fontSize: 24 },
  optionText: { color: "#ffffff", fontWeight: "600", fontSize: 14 },
  inputLabel: { color: "rgba(255,255,255,0.7)", fontSize: 14 },
  inputBox: { backgroundColor: "rgba(255,255,255,0.05)", padding: 16, borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  inputText: { color: "#ffffff", fontSize: 16, fontWeight: "bold" },
  infoText: { color: "rgba(255,255,255,0.6)", fontSize: 14, lineHeight: 20 },
  resultCard: { backgroundColor: "rgba(28, 46, 34, 0.8)", padding: 20, borderRadius: 16, borderWidth: 1, borderColor: "#28906d", gap: 8 },
  resultLabel: { color: "rgba(255,255,255,0.6)", fontSize: 12 },
  resultValue: { fontSize: 24, fontWeight: "bold" },
  positive: { color: "#4ade80" },
  negative: { color: "#f87171" },
  saveBtn: { backgroundColor: "#28906d", padding: 16, borderRadius: 12, alignItems: "center" },
  saveBtnText: { color: "#ffffff", fontWeight: "bold", fontSize: 14 },
  navRow: { flexDirection: "row", gap: 12, marginTop: 12 },
  backBtn: { flex: 1, backgroundColor: "rgba(255,255,255,0.1)", padding: 14, borderRadius: 12, alignItems: "center" },
  nextBtn: { flex: 2, backgroundColor: "#28906d", padding: 14, borderRadius: 12, alignItems: "center" },
  btnText: { color: "#ffffff", fontWeight: "bold" },
});
