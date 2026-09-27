import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, RefreshControl } from "react-native";
import { mobileStorage, type MobileStoredScenario } from "../../lib/storage";
import { ScenarioCard } from "../../components/ScenarioCard";

export default function DashboardScreen() {
  const [scenarios, setScenarios] = useState<MobileStoredScenario[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function loadData() {
    setRefreshing(true);
    const list = await mobileStorage.loadScenarios();
    setScenarios(list);
    setRefreshing(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.brand}>🌏 BandingHidup</Text>
          <Text style={styles.title}>Saved Scenarios</Text>
          <Text style={styles.subtitle}>100% Offline Device Storage</Text>
        </View>

        <FlatList
          data={scenarios}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor="#28906d" />}
          renderItem={({ item }) => (
            <ScenarioCard
              scenario={item}
              onDelete={async () => {
                await mobileStorage.deleteScenario(item.id);
                loadData();
              }}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No saved scenarios on this device yet.</Text>
              <Text style={styles.emptySubtext}>Use the Wizard tab to create your first simulation.</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#090d16",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  brand: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#28906d",
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
  },
  subtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.5)",
    marginTop: 2,
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  emptySubtext: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
  },
});
