import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { DiagnosticLevel } from "@bandinghidup/core";

interface DiagnosticBadgeProps {
  level: DiagnosticLevel;
}

export function DiagnosticBadge({ level }: DiagnosticBadgeProps) {
  const styles = getStyles(level);

  return (
    <View style={[defaultStyles.badge, styles.container]}>
      <Text style={styles.text}>
        {level === "red" ? "🔴 High Risk" : level === "amber" ? "🟡 Caution" : "🟢 Viable"}
      </Text>
    </View>
  );
}

function getStyles(level: DiagnosticLevel) {
  switch (level) {
    case "red":
      return StyleSheet.create({
        container: { backgroundColor: "rgba(239, 68, 68, 0.2)", borderColor: "rgba(239, 68, 68, 0.5)" },
        text: { color: "#f87171" },
      });
    case "amber":
      return StyleSheet.create({
        container: { backgroundColor: "rgba(249, 134, 7, 0.2)", borderColor: "rgba(249, 134, 7, 0.5)" },
        text: { color: "#ffa528" },
      });
    case "green":
      return StyleSheet.create({
        container: { backgroundColor: "rgba(40, 144, 109, 0.2)", borderColor: "rgba(40, 144, 109, 0.5)" },
        text: { color: "#4ade80" },
      });
  }
}

const defaultStyles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
});
