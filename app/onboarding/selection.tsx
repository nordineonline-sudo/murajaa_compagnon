import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getDatabase } from '@/db/database';
import { getAllSurahs, getAllJuzs, getAllHizbs, getAllPages } from '@/db/repositories/quranRepo';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/theme';
import type { ReviewUnit } from '@/types';
import { useSettingsStore } from '@/stores/settingsStore';

type Tab = ReviewUnit;

interface SelectionItem {
  unitType: ReviewUnit;
  unitId: number;
  label: string;
  selected: boolean;
}

export default function OnboardingSelectionScreen() {
  const router = useRouter();
  const { settings, updatePlanning } = useSettingsStore();
  const [activeTab, setActiveTab] = useState<Tab>('page');
  const [items, setItems] = useState<SelectionItem[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const TABS: { key: Tab; label: string }[] = [
    { key: 'surah', label: 'Sourate' },
    { key: 'page', label: 'Page' },
    { key: 'juz', label: 'Juz' },
    { key: 'hizb', label: 'Hizb' },
    { key: 'line', label: 'Ligne' },
  ];

  useEffect(() => {
    loadItems(activeTab);
  }, [activeTab]);

  async function loadItems(tab: Tab) {
    const db = await getDatabase();
    let list: SelectionItem[] = [];

    if (tab === 'surah') {
      const surahs = await getAllSurahs(db);
      list = surahs.map(s => ({
        unitType: 'surah' as ReviewUnit,
        unitId: s.id,
        label: `${s.id}. ${s.nameFr} (${s.nameArabic})`,
        selected: false,
      }));
    } else if (tab === 'page') {
      const pages = await getAllPages(db);
      list = pages.map(p => ({
        unitType: 'page' as ReviewUnit,
        unitId: p.id,
        label: `Page ${p.id} — Juz ${p.juzId}`,
        selected: false,
      }));
    } else if (tab === 'juz') {
      const juzs = await getAllJuzs(db);
      list = juzs.map(j => ({
        unitType: 'juz' as ReviewUnit,
        unitId: j.id,
        label: `${j.id}. ${j.nameArabic} (pages ${j.startPage}–${j.endPage})`,
        selected: false,
      }));
    } else if (tab === 'hizb') {
      const hizbs = await getAllHizbs(db);
      list = hizbs.map(h => ({
        unitType: 'hizb' as ReviewUnit,
        unitId: h.id,
        label: `Hizb ${h.id} — Juz ${h.juzId}`,
        selected: false,
      }));
    } else {
      // Lines: show pages as proxy (each page has ~15 lines)
      const pages = await getAllPages(db);
      list = pages.flatMap(p =>
        Array.from({ length: p.lineCount }, (_, i) => ({
          unitType: 'line' as ReviewUnit,
          unitId: p.id * 100 + (i + 1),
          label: `Page ${p.id} – Ligne ${i + 1}`,
          selected: false,
        }))
      );
    }
    setItems(list);
    setSelectAll(false);
  }

  function toggleItem(unitId: number) {
    setItems(prev =>
      prev.map(i => i.unitId === unitId ? { ...i, selected: !i.selected } : i)
    );
  }

  function toggleSelectAll() {
    const next = !selectAll;
    setSelectAll(next);
    setItems(prev => prev.map(i => ({ ...i, selected: next })));
  }

  async function goNext() {
    await updatePlanning({ reviewUnit: activeTab });
    router.push({
      pathname: '/onboarding/plan-setup',
      params: {
        selections: JSON.stringify(
          items.filter(i => i.selected).map(i => ({
            unitType: i.unitType,
            unitId: i.unitId,
            label: i.label,
          }))
        ),
      },
    });
  }

  const selectedCount = items.filter(i => i.selected).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Que voulez-vous réviser ?</Text>
        <Text style={styles.subtitle}>
          Sélectionnez les unités à inclure dans votre plan.
        </Text>

        <View style={styles.tabBar}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, activeTab === t.key && styles.tabActive]}
              onPress={() => setActiveTab(t.key)}
            >
              <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.selectAllRow}>
          <Text style={styles.selectAllLabel}>
            {selectedCount} sélectionné{selectedCount !== 1 ? 's' : ''}
          </Text>
          <TouchableOpacity onPress={toggleSelectAll} style={styles.selectAllBtn}>
            <Text style={styles.selectAllText}>
              {selectAll ? 'Tout désélectionner' : 'Tout sélectionner'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={i => `${i.unitType}-${i.unitId}`}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.item, item.selected && styles.itemSelected]}
            onPress={() => toggleItem(item.unitId)}
          >
            <View style={[styles.checkbox, item.selected && styles.checkboxChecked]}>
              {item.selected && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.itemLabel} numberOfLines={1}>{item.label}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextBtn, selectedCount === 0 && styles.nextBtnDisabled]}
          onPress={goNext}
          disabled={selectedCount === 0}
        >
          <Text style={styles.nextBtnText}>
            Continuer ({selectedCount} unités) →
          </Text>
        </TouchableOpacity>
        {selectedCount === 0 && (
          <Text style={styles.footerHint}>Sélectionnez au moins une unité</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.surface, paddingBottom: 0 },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
    padding: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  tabTextActive: { color: Colors.primary, fontWeight: '700' },
  selectAllRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  selectAllLabel: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  selectAllBtn: {},
  selectAllText: { fontSize: FontSizes.sm, color: Colors.primary, fontWeight: '600' },
  list: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    marginBottom: 2,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  itemSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '08' },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkmark: { color: Colors.textInverse, fontSize: 13, fontWeight: '700' },
  itemLabel: { flex: 1, fontSize: FontSizes.md, color: Colors.text },
  footer: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  nextBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  nextBtnDisabled: { backgroundColor: Colors.border },
  nextBtnText: { color: Colors.textInverse, fontSize: FontSizes.lg, fontWeight: '700' },
  footerHint: { textAlign: 'center', color: Colors.textLight, fontSize: FontSizes.sm, marginTop: Spacing.sm },
});
