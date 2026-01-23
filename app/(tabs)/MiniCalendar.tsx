import { useTheme } from '@/hooks/use-theme';
import { loadStreakData, StreakItem } from '@/utils/storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function MiniCalendarScreen() {
  const { colors } = useTheme();
  const [streaks, setStreaks] = useState<StreakItem[]>([]);

  const loadData = useCallback(async () => {
    const loadedStreaks = await loadStreakData();
    setStreaks(loadedStreaks);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Ekran her focus olduğunda veriyi yenile
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Combine all doneDates from all streaks
  const getAllDoneDates = (): string[] => {
    const allDates = new Set<string>();
    streaks.forEach(streak => {
      streak.doneDates.forEach(date => allDates.add(date));
    });
    return Array.from(allDates);
  };

  const dynamicStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    title: { fontSize: 32, fontWeight: '700', color: colors.text, marginBottom: 8, textAlign: 'center' },
    subtitle: { fontSize: 14, color: colors.secondaryText, marginBottom: 24, textAlign: 'center' },
    dayText: { color: colors.text, fontWeight: '700', fontSize: 14 },
    streakCountBadge: {
      position: 'absolute',
      top: -4,
      right: -4,
      backgroundColor: colors.info,
      color: colors.text,
      fontSize: 10,
      fontWeight: '700',
      borderRadius: 8,
      paddingHorizontal: 4,
      paddingVertical: 2,
      minWidth: 16,
      textAlign: 'center',
    },
    emptyText: {
      color: colors.secondaryText,
      fontSize: 14,
      textAlign: 'center',
    },
  });

  const renderMiniCalendar = () => {
    const daysToShow = 30; // Son 30 günü göster
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const datesArray = [];
    for (let i = daysToShow - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      d.setHours(0, 0, 0, 0);
      datesArray.push(d);
    }

    const allDoneDates = getAllDoneDates();

    return (
      <View style={styles.calendarContainer}>
        {datesArray.map((date, index) => {
          const dateString = date.toDateString();
          const done = allDoneDates.includes(dateString);
          const isToday = dateString === today.toDateString();
          const isPast = date < today;
          
          // Count how many streaks were done on this day
          const streakCount = streaks.filter(s => s.doneDates.includes(dateString)).length;
          
          return (
            <View
              key={index}
              style={[
                styles.dayBox,
                {
                  backgroundColor: done
                    ? colors.success
                    : isPast
                    ? colors.danger
                    : colors.cardBorder,
                },
                isToday && { borderWidth: 2, borderColor: colors.text },
              ]}
            >
              <Text style={dynamicStyles.dayText}>{date.getDate()}</Text>
              {streakCount > 1 && (
                <Text style={[dynamicStyles.streakCountBadge, { color: colors.text }]}>{streakCount}</Text>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <Text style={dynamicStyles.title}>Calendar</Text>
        <Text style={dynamicStyles.subtitle}>
          {streaks.length > 0 
            ? `All ${streaks.length} streak${streaks.length > 1 ? 's' : ''} - Last 30 days`
            : 'No streaks yet'}
        </Text>
        {streaks.length > 0 ? (
          renderMiniCalendar()
        ) : (
          <View style={styles.emptyState}>
            <Text style={dynamicStyles.emptyText}>Create your first streak to see the calendar!</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, padding: 24, alignItems: 'center' },
  calendarContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'center', 
    gap: 8,
    width: '100%',
    maxWidth: 400,
  },
  dayBox: { 
    width: 44, 
    height: 44, 
    borderRadius: 10, 
    alignItems: 'center', 
    justifyContent: 'center',
    position: 'relative',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
});
