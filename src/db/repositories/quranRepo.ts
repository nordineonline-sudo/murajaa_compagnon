import { SQLiteDatabase } from 'expo-sqlite';
import type { Ayah, PageMushaf, Surah, Juz, Hizb, Line } from '@/types';

// ─── Surahs ──────────────────────────────────────────────────────────────────

export async function getAllSurahs(db: SQLiteDatabase): Promise<Surah[]> {
  const rows = await db.getAllAsync<{
    id: number; name_arabic: string; name_translit: string;
    name_fr: string; verse_count: number; revelation_type: string; start_page: number;
  }>('SELECT * FROM surahs ORDER BY id');
  return rows.map(r => ({
    id: r.id,
    nameArabic: r.name_arabic,
    nameTranslit: r.name_translit,
    nameFr: r.name_fr,
    verseCount: r.verse_count,
    revelationType: r.revelation_type as 'meccan' | 'medinan',
    startPage: r.start_page,
  }));
}

export async function getSurahById(db: SQLiteDatabase, id: number): Promise<Surah | null> {
  const r = await db.getFirstAsync<{
    id: number; name_arabic: string; name_translit: string;
    name_fr: string; verse_count: number; revelation_type: string; start_page: number;
  }>('SELECT * FROM surahs WHERE id = ?', [id]);
  if (!r) return null;
  return {
    id: r.id, nameArabic: r.name_arabic, nameTranslit: r.name_translit,
    nameFr: r.name_fr, verseCount: r.verse_count,
    revelationType: r.revelation_type as 'meccan' | 'medinan', startPage: r.start_page,
  };
}

// ─── Ayahs ────────────────────────────────────────────────────────────────────

export async function getAyahsByPage(db: SQLiteDatabase, pageId: number): Promise<Ayah[]> {
  const rows = await db.getAllAsync<{
    id: number; surah_id: number; number_in_surah: number; arabic: string;
    transliteration: string; phonetic_fr: string; translation_fr: string;
    page_id: number; juz_id: number; hizb_id: number;
  }>('SELECT * FROM ayahs WHERE page_id = ? ORDER BY id', [pageId]);
  return rows.map(mapAyah);
}

export async function getAyahsBySurah(db: SQLiteDatabase, surahId: number): Promise<Ayah[]> {
  const rows = await db.getAllAsync<{
    id: number; surah_id: number; number_in_surah: number; arabic: string;
    transliteration: string; phonetic_fr: string; translation_fr: string;
    page_id: number; juz_id: number; hizb_id: number;
  }>('SELECT * FROM ayahs WHERE surah_id = ? ORDER BY id', [surahId]);
  return rows.map(mapAyah);
}

export async function getAyahsByJuz(db: SQLiteDatabase, juzId: number): Promise<Ayah[]> {
  const rows = await db.getAllAsync<{
    id: number; surah_id: number; number_in_surah: number; arabic: string;
    transliteration: string; phonetic_fr: string; translation_fr: string;
    page_id: number; juz_id: number; hizb_id: number;
  }>('SELECT * FROM ayahs WHERE juz_id = ? ORDER BY id', [juzId]);
  return rows.map(mapAyah);
}

function mapAyah(r: {
  id: number; surah_id: number; number_in_surah: number; arabic: string;
  transliteration: string; phonetic_fr: string; translation_fr: string;
  page_id: number; juz_id: number; hizb_id: number;
}): Ayah {
  return {
    id: r.id, surahId: r.surah_id, numberInSurah: r.number_in_surah,
    arabic: r.arabic, transliteration: r.transliteration,
    phoneticFr: r.phonetic_fr, translationFr: r.translation_fr,
    pageId: r.page_id, juzId: r.juz_id, hizbId: r.hizb_id,
  };
}

// ─── Pages ────────────────────────────────────────────────────────────────────

export async function getPageById(db: SQLiteDatabase, id: number): Promise<PageMushaf | null> {
  const r = await db.getFirstAsync<{
    id: number; juz_id: number; hizb_id: number;
    first_ayah_id: number; last_ayah_id: number; line_count: number;
  }>('SELECT * FROM pages_mushaf WHERE id = ?', [id]);
  if (!r) return null;
  return {
    id: r.id, juzId: r.juz_id, hizbId: r.hizb_id,
    firstAyahId: r.first_ayah_id, lastAyahId: r.last_ayah_id, lineCount: r.line_count,
  };
}

export async function getAllPages(db: SQLiteDatabase): Promise<PageMushaf[]> {
  const rows = await db.getAllAsync<{
    id: number; juz_id: number; hizb_id: number;
    first_ayah_id: number; last_ayah_id: number; line_count: number;
  }>('SELECT * FROM pages_mushaf ORDER BY id');
  return rows.map(r => ({
    id: r.id, juzId: r.juz_id, hizbId: r.hizb_id,
    firstAyahId: r.first_ayah_id, lastAyahId: r.last_ayah_id, lineCount: r.line_count,
  }));
}

// ─── Lines ────────────────────────────────────────────────────────────────────

export async function getLinesByPage(db: SQLiteDatabase, pageId: number): Promise<Line[]> {
  const rows = await db.getAllAsync<{
    id: number; page_id: number; line_index: number; ayah_ids: string; is_basmala: number;
  }>('SELECT * FROM lines WHERE page_id = ? ORDER BY line_index', [pageId]);
  return rows.map(r => ({
    id: r.id, pageId: r.page_id, lineIndex: r.line_index,
    ayahIds: JSON.parse(r.ayah_ids) as number[],
    isBasmala: r.is_basmala === 1,
  }));
}

// ─── Juzs ─────────────────────────────────────────────────────────────────────

export async function getAllJuzs(db: SQLiteDatabase): Promise<Juz[]> {
  const rows = await db.getAllAsync<{
    id: number; name_arabic: string; start_page: number; end_page: number;
    first_ayah_id: number; last_ayah_id: number;
  }>('SELECT * FROM juzs ORDER BY id');
  return rows.map(r => ({
    id: r.id, nameArabic: r.name_arabic, startPage: r.start_page,
    endPage: r.end_page, firstAyahId: r.first_ayah_id, lastAyahId: r.last_ayah_id,
  }));
}

// ─── Hizbs ────────────────────────────────────────────────────────────────────

export async function getAllHizbs(db: SQLiteDatabase): Promise<Hizb[]> {
  const rows = await db.getAllAsync<{
    id: number; juz_id: number; start_page: number; end_page: number;
    first_ayah_id: number; last_ayah_id: number;
  }>('SELECT * FROM hizbs ORDER BY id');
  return rows.map(r => ({
    id: r.id, juzId: r.juz_id, startPage: r.start_page,
    endPage: r.end_page, firstAyahId: r.first_ayah_id, lastAyahId: r.last_ayah_id,
  }));
}
