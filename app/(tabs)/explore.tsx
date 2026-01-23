import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/hooks/use-theme';
import { loadStreakData } from '@/utils/storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function ExploreScreen() {
  const { colors } = useTheme();
  const [stats, setStats] = useState({
    totalStreaks: 0,
    totalDays: 0,
    bestStreak: 0,
    averageStreak: 0,
    completionRate: 0,
  });

  const loadStats = useCallback(async () => {
    const streaks = await loadStreakData();
    
    if (streaks.length === 0) {
      setStats({
        totalStreaks: 0,
        totalDays: 0,
        bestStreak: 0,
        averageStreak: 0,
        completionRate: 0,
      });
      return;
    }

    // Calculate stats from all streaks
    const totalDays = streaks.reduce((sum, s) => sum + s.doneDates.length, 0);
    const bestStreak = Math.max(...streaks.map(s => s.streak), 0);
    const averageStreak = streaks.length > 0 
      ? Math.round(streaks.reduce((sum, s) => sum + s.streak, 0) / streaks.length)
      : 0;

    // Calculate completion rate (last 30 days) - combine all streaks
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const allDoneDates = new Set<string>();
    streaks.forEach(streak => {
      streak.doneDates.forEach(date => {
        const d = new Date(date);
        if (d >= thirtyDaysAgo) {
          allDoneDates.add(date);
        }
      });
    });
    const completionRate = Math.round((allDoneDates.size / 30) * 100);

    setStats({
      totalStreaks: streaks.length,
      totalDays,
      bestStreak,
      averageStreak,
      completionRate,
    });
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  const dynamicStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    title: { fontSize: 32, fontWeight: '700', color: colors.text, marginBottom: 24, textAlign: 'center' },
    statCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 20,
      alignItems: 'center',
      width: '47%',
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    statValue: { fontSize: 32, fontWeight: '700', color: colors.text, marginTop: 12, marginBottom: 4 },
    statLabel: { fontSize: 12, color: colors.secondaryText, textAlign: 'center' },
    infoSection: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    infoTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 12 },
    infoText: { fontSize: 14, color: colors.secondaryText, lineHeight: 20, marginBottom: 12 },
  });

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <Text style={dynamicStyles.title}>Statistics</Text>
        
        <View style={styles.statsGrid}>
          <View style={dynamicStyles.statCard}>
            <IconSymbol name="list.bullet" size={32} color={colors.info} />
            <Text style={dynamicStyles.statValue}>{stats.totalStreaks}</Text>
            <Text style={dynamicStyles.statLabel}>Total Streaks</Text>
          </View>

          <View style={dynamicStyles.statCard}>
            <IconSymbol name="trophy.fill" size={32} color={colors.warning} />
            <Text style={dynamicStyles.statValue}>{stats.bestStreak}</Text>
            <Text style={dynamicStyles.statLabel}>Best Streak</Text>
          </View>

          <View style={dynamicStyles.statCard}>
            <IconSymbol name="checkmark.circle.fill" size={32} color={colors.success} />
            <Text style={dynamicStyles.statValue}>{stats.totalDays}</Text>
            <Text style={dynamicStyles.statLabel}>Total Days</Text>
          </View>

          <View style={dynamicStyles.statCard}>
            <IconSymbol name="chart.bar.fill" size={32} color="#8b5cf6" />
            <Text style={dynamicStyles.statValue}>{stats.averageStreak}</Text>
            <Text style={dynamicStyles.statLabel}>Avg Streak</Text>
          </View>

          <View style={[dynamicStyles.statCard, styles.fullWidthCard]}>
            <IconSymbol name="calendar" size={32} color="#ec4899" />
            <Text style={dynamicStyles.statValue}>{stats.completionRate}%</Text>
            <Text style={dynamicStyles.statLabel}>Completion Rate (Last 30 Days)</Text>
          </View>
        </View>

        <View style={dynamicStyles.infoSection}>
          <Text style={dynamicStyles.infoTitle}>About StreakOne</Text>
          <Text style={dynamicStyles.infoText}>
            Track your daily habits and build consistency. Mark each day as done to maintain your streak.
          </Text>
          <Text style={dynamicStyles.infoText}>
            Keep your streak alive by completing your task every day. Missing a day will reset your current streak.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 16,
  },
  fullWidthCard: {
    width: '100%',
    marginTop: 8,
  },
});
