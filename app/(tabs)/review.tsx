import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/theme';
import { getDatabase } from '@/db/database';
import { getAllSurahs, getAllJuzs, getAllHizbs, getAllPages } from '@/db/repositories/quranRepo';
import type { Surah, Juz, Hizb, PageMushaf, ReviewUnit } from '@/types';

type Tab = 'surah' | 'page' | 'juz' | 'hizb';

export default function ReviewScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('surah');
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [juzs, setJuzs] = useState<Juz[]>([]);
  const [hizbs, setHizbs] = useState<Hizb[]>([]);
  const [pages, setPages] = useState<PageMushaf[]>([]);

  useEffect(() => {
    async function load() {
      const db = await getDatabase();
      const [s, j, h, p] = await Promise.all([
        getAllSurahs(db),
        getAllJuzs(db),
        getAllHizbs(db),
        getAllPages(db),
      ]);
      setSurahs(s);
      setJuzs(j);
      setHizbs(h);
      setPages(p);
    }
    load();
  }, []);

  const TABS: { key: Tab; label: string }[] = [
    { key: 'surah', label: 'Sourate' },
    { key: 'page', label: 'Page' },
    { key: 'juz', label: 'Juz' },
    { key: 'hizb', label: 'Hizb' },
  ];

  function navigateToPage(pageId: number) {
    router.push({ pathname: '/reader/[pageId]', params: { pageId: String(pageId) } });
  }

  function renderItem({ item }: { item: Surah | Juz | Hizb | PageMushaf }) {
    if (activeTab === 'surah') {
      const s = item as Surah;
      return (
        <TouchableOpacity
          style={styles.item}
          onPress={() => navigateToPage(s.startPage)}
        >
          <View style={styles.itemLeft}>
            <View style={styles.numBadge}>
              <Text style={styles.numText}>{s.id}</Text>
            </View>
            <View>
              <Text style={styles.itemArabic}>{s.nameArabic}</Text>
              <Text style={styles.itemSub}>{s.nameFr} • {s.verseCount} versets</Text>
            </View>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      );
    }

    if (activeTab === 'page') {
      const p = item as PageMushaf;
      return (
        <TouchableOpacity style={styles.item} onPress={() => navigateToPage(p.id)}>
          <View style={styles.itemLeft}>
            <View style={styles.numBadge}>
              <Text style={styles.numText}>{p.id}</Text>
            </View>
            <Text style={styles.itemTitle}>Page {p.id} — Juz {p.juzId}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      );
    }

    if (activeTab === 'juz') {
      const j = item as Juz;
      return (
        <TouchableOpacity style={styles.item} onPress={() => navigateToPage(j.startPage)}>
          <View style={styles.itemLeft}>
            <View style={styles.numBadge}>
              <Text style={styles.numText}>{j.id}</Text>
            </View>
            <View>
              <Text style={styles.itemArabic}>{j.nameArabic}</Text>
              <Text style={styles.itemSub}>Pages {j.startPage}–{j.endPage}</Text>
            </View>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      );
    }

    if (activeTab === 'hizb') {
      const h = item as Hizb;
      return (
        <TouchableOpacity style={styles.item} onPress={() => navigateToPage(h.startPage)}>
          <View style={styles.itemLeft}>
            <View style={styles.numBadge}>
              <Text style={styles.numText}>{h.id}</Text>
            </View>
            <Text style={styles.itemTitle}>Hizb {h.id} • Juz {h.juzId}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      );
    }

    return null;
  }

  const data: (Surah | Juz | Hizb | PageMushaf)[] =
    activeTab === 'surah' ? surahs
    : activeTab === 'juz' ? juzs
    : activeTab === 'hizb' ? hizbs
    : pages;

  return (
    <View style={styles.container}>
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

      <FlatList
        data={data}
        keyExtractor={i => String(i.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Aucune donnée — téléchargez les données Coran dans les Paramètres.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
  tabText: { color: Colors.textSecondary, fontSize: FontSizes.md },
  tabTextActive: { color: Colors.primary, fontWeight: '700' },
  list: { padding: Spacing.sm },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    marginBottom: 1,
    borderRadius: BorderRadius.sm,
  },
  itemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  numBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  numText: { color: Colors.primary, fontWeight: '700', fontSize: FontSizes.sm },
  itemArabic: { fontSize: FontSizes.lg, color: Colors.arabic, fontWeight: '500' },
  itemTitle: { fontSize: FontSizes.md, color: Colors.text },
  itemSub: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  chevron: { color: Colors.textLight, fontSize: 22 },
  emptyState: { padding: Spacing.xl, alignItems: 'center' },
  emptyText: { color: Colors.textSecondary, textAlign: 'center' },
});
