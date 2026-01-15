import { IconSymbol } from '@/components/ui/icon-symbol';
import { loadStreakData } from '@/utils/storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function ExploreScreen() {
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Statistics</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <IconSymbol name="list.bullet" size={32} color="#3b82f6" />
            <Text style={styles.statValue}>{stats.totalStreaks}</Text>
            <Text style={styles.statLabel}>Total Streaks</Text>
          </View>

          <View style={styles.statCard}>
            <IconSymbol name="trophy.fill" size={32} color="#ffd700" />
            <Text style={styles.statValue}>{stats.bestStreak}</Text>
            <Text style={styles.statLabel}>Best Streak</Text>
          </View>

          <View style={styles.statCard}>
            <IconSymbol name="checkmark.circle.fill" size={32} color="#22c55e" />
            <Text style={styles.statValue}>{stats.totalDays}</Text>
            <Text style={styles.statLabel}>Total Days</Text>
          </View>

          <View style={styles.statCard}>
            <IconSymbol name="chart.bar.fill" size={32} color="#8b5cf6" />
            <Text style={styles.statValue}>{stats.averageStreak}</Text>
            <Text style={styles.statLabel}>Avg Streak</Text>
          </View>

          <View style={[styles.statCard, styles.fullWidthCard]}>
            <IconSymbol name="calendar" size={32} color="#ec4899" />
            <Text style={styles.statValue}>{stats.completionRate}%</Text>
            <Text style={styles.statLabel}>Completion Rate (Last 30 Days)</Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>About StreakOne</Text>
          <Text style={styles.infoText}>
            Track your daily habits and build consistency. Mark each day as done to maintain your streak.
          </Text>
          <Text style={styles.infoText}>
            Keep your streak alive by completing your task every day. Missing a day will reset your current streak.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  scrollContainer: {
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 24,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 16,
  },
  statCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    width: '47%',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  fullWidthCard: {
    width: '100%',
    marginTop: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginTop: 12,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  infoSection: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
    marginBottom: 12,
  },
});
