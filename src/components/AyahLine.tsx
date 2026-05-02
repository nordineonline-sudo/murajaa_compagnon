import React from 'react';
import { View, Text, StyleSheet, I18nManager } from 'react-native';
import type { Ayah } from '@/types';
import type { DisplaySettings } from '@/types';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/theme';

interface AyahLineProps {
  ayahs: Ayah[];
  display: DisplaySettings;
  highlighted?: boolean;
  lineIndex: number;
}

export function AyahLine({ ayahs, display, highlighted, lineIndex }: AyahLineProps) {
  const arabicText = ayahs.map(a => `${a.arabic} ۝${a.numberInSurah}`).join(' ');
  const translitText = ayahs.map(a => a.transliteration).join(' • ');
  const phoneticText = ayahs.map(a => a.phoneticFr).join(' • ');
  const translationText = ayahs.map(a => `[${a.numberInSurah}] ${a.translationFr}`).join(' ');

  return (
    <View style={[styles.container, highlighted && styles.highlighted]}>
      {display.showArabic && (
        <Text
          style={[styles.arabic, { fontSize: display.arabicFontSize }]}
          textBreakStrategy="simple"
        >
          {arabicText}
        </Text>
      )}
      {display.showTransliteration && translitText.trim() !== '' && (
        <Text style={styles.translit}>{translitText}</Text>
      )}
      {display.showPhonetic && phoneticText.trim() !== '' && (
        <Text style={styles.phonetic}>{phoneticText}</Text>
      )}
      {display.showTranslation && (
        <Text style={[styles.translation, { fontSize: display.translationFontSize }]}>
          {translationText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  highlighted: {
    backgroundColor: Colors.accentLight + '33',
    borderRadius: BorderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
  },
  arabic: {
    fontFamily: 'System',
    writingDirection: 'rtl',
    textAlign: 'right',
    color: Colors.arabic,
    lineHeight: 44,
    marginBottom: Spacing.xs,
  },
  translit: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 2,
  },
  phonetic: {
    fontSize: FontSizes.sm,
    color: Colors.primaryLight,
    marginBottom: 2,
  },
  translation: {
    color: Colors.text,
    lineHeight: 20,
    marginTop: Spacing.xs,
  },
});
