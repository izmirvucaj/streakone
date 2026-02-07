import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/hooks/use-theme';
import { loadStreakData, StreakItem } from '@/utils/storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function MiniCalendarScreen() {
  const { colors, isDark } = useTheme();
  const [streaks, setStreaks] = useState<StreakItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);

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

  const getStreaksForDate = (date: Date): StreakItem[] => {
    const dateString = date.toDateString();
    return streaks.filter(s => s.doneDates.includes(dateString));
  };

  const handleDatePress = (date: Date) => {
    const streaksOnDate = getStreaksForDate(date);
    if (streaksOnDate.length > 0) {
      setSelectedDate(date);
      setShowModal(true);
    }
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
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.modalOverlay,
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.cardBackground,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      maxHeight: '70%',
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    modalDate: {
      fontSize: 14,
      color: colors.secondaryText,
      marginTop: 4,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.inputBackground,
      alignItems: 'center',
      justifyContent: 'center',
    },
    streakItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderLeftWidth: 4,
    },
    streakItemText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    streakItemCount: {
      fontSize: 14,
      color: colors.secondaryText,
      marginLeft: 8,
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
            <Pressable
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
              onPress={() => handleDatePress(date)}
              disabled={!done}
            >
              <Text style={dynamicStyles.dayText}>{date.getDate()}</Text>
              {streakCount > 1 && (
                <Text style={[dynamicStyles.streakCountBadge, { color: colors.text }]}>{streakCount}</Text>
              )}
            </Pressable>
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

      {/* Day Detail Modal */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <Pressable
          style={dynamicStyles.modalOverlay}
          onPress={() => setShowModal(false)}
        >
          <Pressable
            style={dynamicStyles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={dynamicStyles.modalHeader}>
              <View>
                <Text style={dynamicStyles.modalTitle}>Completed Streaks</Text>
                {selectedDate && (
                  <Text style={dynamicStyles.modalDate}>
                    {selectedDate.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </Text>
                )}
              </View>
              <Pressable
                style={dynamicStyles.closeButton}
                onPress={() => setShowModal(false)}
              >
                <IconSymbol name="xmark" size={16} color={colors.secondaryText} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedDate && getStreaksForDate(selectedDate).map((streak) => (
                <View
                  key={streak.id}
                  style={[dynamicStyles.streakItem, { borderLeftColor: streak.color }]}
                >
                  <Text style={dynamicStyles.streakItemText}>{streak.name}</Text>
                  <Text style={dynamicStyles.streakItemCount}>
                    🔥 {streak.streak} days
                  </Text>
                </View>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
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
