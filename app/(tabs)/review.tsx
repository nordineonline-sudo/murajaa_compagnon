import React, { useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useTasksStore } from "@/stores/tasksStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { Colors, Spacing, FontSizes, BorderRadius } from "@/constants/theme";
import { todayDateString } from "@/services/planningAlgorithm";

export default function PlanScreen() {
  const router = useRouter();
  const { activePlan, todayCounts, loadToday } = useTasksStore();
  const { setOnboardingComplete } = useSettingsStore();

  useEffect(() => { loadToday(); }, []);

  async function handleReset() {
    Alert.alert(
      "Réinitialiser le plan",
      "Cela supprimera votre plan actuel et relancera la configuration.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Confirmer",
          style: "destructive",
          onPress: async () => {
            await setOnboardingComplete(false);
            router.replace("/onboarding/display");
          },
        },
      ]
    );
  }

  const today = todayDateString();
  const planEnd = activePlan
    ? new Date(new Date(activePlan.startDate).getTime() + activePlan.nbDays * 86400000)
        .toISOString().substring(0, 10)
    : null;
  const daysLeft = planEnd
    ? Math.max(0, Math.ceil((new Date(planEnd).getTime() - new Date(today).getTime()) / 86400000))
    : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Mon Plan</Text>
      {activePlan ? (
        <>
          <View style={styles.card}>
            <InfoRow label="Début" value={activePlan.startDate} />
            <InfoRow label="Durée" value={activePlan.nbDays + " jours"} />
            <InfoRow label="Fin prévue" value={planEnd ?? "—"} />
            <InfoRow label="Jours restants" value={daysLeft + " j"} />
            <InfoRow label="Quantité / jour" value={String(activePlan.quantityPerDay)} />
            <InfoRow label="Backlog" value={activePlan.backlogStrategy === "postpone" ? "Reporter" : "Répartir"} />
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Aujourd'hui</Text>
            <View style={styles.statsRow}>
              <StatBox label="À faire" value={todayCounts.planned} color={Colors.planned} />
              <StatBox label="Faits" value={todayCounts.done} color={Colors.done} />
              <StatBox label="Ignorés" value={todayCounts.skipped} color={Colors.skipped} />
              <StatBox label="Reportés" value={todayCounts.backlog} color={Colors.backlog} />
            </View>
          </View>
          <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
            <Text style={styles.resetBtnText}>Reconfigurer le plan</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Aucun plan actif.</Text>
          <TouchableOpacity style={styles.createBtn} onPress={() => router.replace("/onboarding/display")}>
            <Text style={styles.createBtnText}>Créer un plan</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg },
  title: { fontSize: 22, fontWeight: "800", color: Colors.primary, marginBottom: Spacing.lg },
  card: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.md, marginBottom: Spacing.md, elevation: 1,
  },
  cardTitle: { fontSize: FontSizes.md, fontWeight: "700", color: Colors.text, marginBottom: Spacing.md },
  infoRow: {
    flexDirection: "row", justifyContent: "space-between",
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border,
  },
  infoLabel: { fontSize: FontSizes.md, color: Colors.textSecondary },
  infoValue: { fontSize: FontSizes.md, fontWeight: "600", color: Colors.text },
  statsRow: { flexDirection: "row", justifyContent: "space-around" },
  statBox: { alignItems: "center", padding: Spacing.sm },
  statValue: { fontSize: 24, fontWeight: "700" },
  statLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 2 },
  resetBtn: {
    marginTop: Spacing.sm, padding: Spacing.md, borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: "#e53935", alignItems: "center",
  },
  resetBtnText: { color: "#e53935", fontWeight: "600", fontSize: FontSizes.md },
  emptyCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.xl, alignItems: "center" },
  emptyText: { fontSize: FontSizes.md, color: Colors.textSecondary, marginBottom: Spacing.lg },
  createBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: BorderRadius.md },
  createBtnText: { color: Colors.textInverse, fontWeight: "700", fontSize: FontSizes.md },
});
