import { loadStreakData, StreakItem } from '@/utils/storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function MiniCalendarScreen() {
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
                    ? '#22c55e'
                    : isPast
                    ? '#dc2626'
                    : '#444',
                },
                isToday && { borderWidth: 2, borderColor: '#fff' },
              ]}
            >
              <Text style={styles.dayText}>{date.getDate()}</Text>
              {streakCount > 1 && (
                <Text style={styles.streakCountBadge}>{streakCount}</Text>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Calendar</Text>
        <Text style={styles.subtitle}>
          {streaks.length > 0 
            ? `All ${streaks.length} streak${streaks.length > 1 ? 's' : ''} - Last 30 days`
            : 'No streaks yet'}
        </Text>
        {streaks.length > 0 ? (
          renderMiniCalendar()
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Create your first streak to see the calendar!</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  scrollContainer: { flexGrow: 1, padding: 16, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#9ca3af', marginBottom: 24, textAlign: 'center' },
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
  dayText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  streakCountBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#3b82f6',
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    minWidth: 16,
    textAlign: 'center',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
  },
});
