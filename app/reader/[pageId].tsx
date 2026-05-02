import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Switch,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getDatabase } from '@/db/database';
import { getAyahsByPage, getLinesByPage, getPageById } from '@/db/repositories/quranRepo';
import { useSettingsStore } from '@/stores/settingsStore';
import { useTasksStore } from '@/stores/tasksStore';
import { AyahLine } from '@/components/AyahLine';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/theme';
import type { Ayah, Line, PageMushaf } from '@/types';

export default function PageReaderScreen() {
  const { pageId, taskId } = useLocalSearchParams<{ pageId: string; taskId?: string }>();
  const router = useRouter();
  const { settings } = useSettingsStore();
  const { markTaskDone } = useTasksStore();

  const [page, setPage] = useState<PageMushaf | null>(null);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [activeLine, setActiveLine] = useState<number | null>(null);
  const [showDisplayPanel, setShowDisplayPanel] = useState(false);
  const startTime = useRef(Date.now());

  const pid = Number(pageId);

  useEffect(() => {
    async function load() {
      const db = await getDatabase();
      const [p, a, l] = await Promise.all([
        getPageById(db, pid),
        getAyahsByPage(db, pid),
        getLinesByPage(db, pid),
      ]);
      setPage(p);
      setAyahs(a);
      setLines(l);
    }
    load();
    startTime.current = Date.now();
  }, [pid]);

  function getAyahsForLine(line: Line): Ayah[] {
    return line.ayahIds
      .map(id => ayahs.find(a => a.id === id))
      .filter(Boolean) as Ayah[];
  }

  async function handleMarkDone() {
    if (taskId) {
      const duration = Math.round((Date.now() - startTime.current) / 1000);
      await markTaskDone(Number(taskId), duration);
    }
    router.push({
      pathname: '/completion',
      params: { pageId, taskId: taskId ?? '' },
    });
  }

  function navigatePage(delta: number) {
    const newId = pid + delta;
    if (newId < 1 || newId > 604) return;
    router.push({ pathname: '/reader/[pageId]', params: { pageId: String(newId), taskId } });
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textInverse} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Page {pid}</Text>
          {page && <Text style={styles.headerSub}>Juz {page.juzId} · Hizb {page.hizbId}</Text>}
        </View>
        <TouchableOpacity
          onPress={() => setShowDisplayPanel(!showDisplayPanel)}
          style={styles.headerBtn}
        >
          <Ionicons name="options-outline" size={22} color={Colors.textInverse} />
        </TouchableOpacity>
      </View>

      {/* Display panel */}
      {showDisplayPanel && <DisplayPanel />}

      {/* Content */}
      <FlatList
        data={lines.length > 0 ? lines : [null]}
        keyExtractor={(item, idx) => item ? String(item.id) : String(idx)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item: line }) => {
          if (!line) {
            // Fallback: render all ayahs without line structure
            return (
              <View>
                {ayahs.map(ayah => (
                  <AyahLine
                    key={ayah.id}
                    ayahs={[ayah]}
                    display={settings.display}
                    lineIndex={ayah.id}
                    highlighted={activeLine === ayah.id}
                  />
                ))}
              </View>
            );
          }
          const lineAyahs = getAyahsForLine(line);
          return (
            <TouchableOpacity onPress={() => setActiveLine(
              activeLine === line.lineIndex ? null : line.lineIndex
            )}>
              <AyahLine
                ayahs={lineAyahs}
                display={settings.display}
                lineIndex={line.lineIndex}
                highlighted={activeLine === line.lineIndex}
              />
            </TouchableOpacity>
          );
        }}
      />

      {/* Page navigation + done button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => navigatePage(-1)}
          disabled={pid <= 1}
        >
          <Ionicons name="chevron-back" size={20} color={pid <= 1 ? Colors.border : Colors.primary} />
          <Text style={[styles.navText, pid <= 1 && styles.navTextDisabled]}>Préc.</Text>
        </TouchableOpacity>

        {taskId ? (
          <TouchableOpacity style={styles.doneBtn} onPress={handleMarkDone}>
            <Text style={styles.doneBtnText}>✓ Marquer fait</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.pageIndicator}>
            <Text style={styles.pageIndicatorText}>{pid} / 604</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => navigatePage(1)}
          disabled={pid >= 604}
        >
          <Text style={[styles.navText, pid >= 604 && styles.navTextDisabled]}>Suiv.</Text>
          <Ionicons name="chevron-forward" size={20} color={pid >= 604 ? Colors.border : Colors.primary} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function DisplayPanel() {
  const { settings, updateDisplay } = useSettingsStore();
  const { display } = settings;

  return (
    <View style={styles.displayPanel}>
      <ToggleRow label="Arabe" value={display.showArabic} onChange={v => updateDisplay({ showArabic: v })} />
      <ToggleRow label="Translit." value={display.showTransliteration} onChange={v => updateDisplay({ showTransliteration: v })} />
      <ToggleRow label="Phonétique" value={display.showPhonetic} onChange={v => updateDisplay({ showPhonetic: v })} />
      <ToggleRow label="Traduction" value={display.showTranslation} onChange={v => updateDisplay({ showTranslation: v })} />
    </View>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: Colors.primary }}
        thumbColor={Colors.surface}
        style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  headerBtn: {
    padding: Spacing.sm,
    width: 44,
    alignItems: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: Colors.textInverse, fontSize: FontSizes.lg, fontWeight: '700' },
  headerSub: { color: Colors.textInverse, opacity: 0.75, fontSize: FontSizes.sm },
  displayPanel: {
    backgroundColor: Colors.surface,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  toggleRow: { alignItems: 'center' },
  toggleLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginBottom: 2 },
  listContent: { paddingBottom: Spacing.xl },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  navBtn: { flexDirection: 'row', alignItems: 'center', padding: Spacing.sm },
  navText: { color: Colors.primary, fontSize: FontSizes.md, fontWeight: '600' },
  navTextDisabled: { color: Colors.border },
  doneBtn: {
    backgroundColor: Colors.done,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
  },
  doneBtnText: { color: Colors.textInverse, fontWeight: '700', fontSize: FontSizes.md },
  pageIndicator: {
    backgroundColor: Colors.background,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  pageIndicatorText: { color: Colors.textSecondary, fontSize: FontSizes.sm },
});
