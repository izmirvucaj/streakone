import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/hooks/use-theme';
import { addStreak, loadStreakData, StreakItem } from '@/utils/storage';
import { generateStreakId, getCurrentMilestone, STREAK_COLORS } from '@/utils/streakHelpers';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

type SortOption = 'highest' | 'newest' | 'oldest' | 'name';

export default function HomeScreen() {
  const { colors, themePreference, setTheme, isDark } = useTheme();
  const [streaks, setStreaks] = useState<StreakItem[]>([]);
  const [filteredStreaks, setFilteredStreaks] = useState<StreakItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('highest');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [newStreakName, setNewStreakName] = useState('');
  const router = useRouter();

  const handleThemeToggle = async () => {
    const newTheme = themePreference === 'light' ? 'dark' : 'light';
    await setTheme(newTheme);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const loadStreaks = useCallback(async () => {
    const loadedStreaks = await loadStreakData();
    setStreaks(loadedStreaks);
  }, []);

  useEffect(() => {
    loadStreaks();
  }, [loadStreaks]);

  // Filter and sort streaks
  useEffect(() => {
    let filtered = [...streaks];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(streak =>
        streak.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    switch (sortOption) {
      case 'highest':
        filtered.sort((a, b) => b.streak - a.streak);
        break;
      case 'newest':
        filtered.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case 'oldest':
        filtered.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    setFilteredStreaks(filtered);
  }, [streaks, searchQuery, sortOption]);

  useFocusEffect(
    useCallback(() => {
      loadStreaks();
    }, [loadStreaks])
  );

  const handleAddStreak = async () => {
    if (!newStreakName.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    const color = STREAK_COLORS[streaks.length % STREAK_COLORS.length];
    const newStreak: StreakItem = {
      id: generateStreakId(),
      name: newStreakName.trim(),
      doneDates: [],
      streak: 0,
      createdAt: new Date().toISOString(),
      color,
    };

    const success = await addStreak(newStreak);
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setNewStreakName('');
      setShowAddModal(false);
      loadStreaks();
    }
  };

  const handleStreakPress = (streakId: string) => {
    router.push(`/streak/${streakId}`);
  };

  const dynamicStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    title: { fontSize: 32, fontWeight: '700', color: colors.text, marginBottom: 4 },
    subtitle: { fontSize: 16, color: colors.secondaryText },
    searchContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    searchInput: {
      flex: 1,
      color: colors.text,
      fontSize: 14,
    },
    sortButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    sortButtonText: {
      color: colors.secondaryText,
      fontSize: 14,
      fontWeight: '500',
    },
    emptySearchText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    emptySearchSubtext: {
      fontSize: 14,
      color: colors.secondaryText,
    },
    emptyText: { fontSize: 20, fontWeight: '600', color: colors.text, marginTop: 16, marginBottom: 8 },
    emptySubtext: { fontSize: 14, color: colors.secondaryText, textAlign: 'center' },
    streakCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderLeftWidth: 4,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    milestoneBadgeSmall: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.cardBackground,
    },
    streakName: { fontSize: 18, fontWeight: '600', color: colors.text, flex: 1 },
    streakDays: { fontSize: 14, color: colors.secondaryText },
    targetProgressBar: {
      height: 5,
      backgroundColor: colors.cardBorder,
      borderRadius: 2,
      overflow: 'hidden',
      marginBottom: 4,
    },
    targetText: { fontSize: 11, color: colors.secondaryText },
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
      paddingBottom: Platform.OS === 'ios' ? 34 : 24,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      maxHeight: '80%',
    },
    modalTitle: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 20 },
    input: {
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      padding: 16,
      color: colors.text,
      fontSize: 16,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      marginBottom: 20,
    },
    cancelButton: { backgroundColor: colors.cardBorder },
    cancelButtonText: { color: colors.text, fontSize: 16, fontWeight: '600' },
    createButton: { backgroundColor: colors.success },
    createButtonText: { color: isDark ? colors.text : '#0f0f0f', fontSize: 16, fontWeight: '700' },
    sortModal: {
      backgroundColor: colors.cardBackground,
      borderRadius: 20,
      padding: 20,
      width: '85%',
      maxWidth: 400,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    sortOption: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 14,
      borderRadius: 12,
      marginBottom: 8,
      backgroundColor: colors.inputBackground,
    },
    sortOptionSelected: {
      backgroundColor: isDark ? '#1a2a1a' : '#e8f5e9',
      borderWidth: 1,
      borderColor: colors.success,
    },
    sortOptionText: {
      color: colors.secondaryText,
      fontSize: 15,
      fontWeight: '500',
    },
    sortOptionTextSelected: {
      color: colors.text,
      fontWeight: '600',
    },
  });

    return (
    <SafeAreaView style={dynamicStyles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerTextContainer}>
              <Text style={dynamicStyles.title}>StreakOne</Text>
              <Text style={dynamicStyles.subtitle}>Track your habits</Text>
            </View>
            <Pressable
              style={styles.themeButton}
              onPress={handleThemeToggle}
            >
              <IconSymbol 
                name={themePreference === 'light' ? "sun.max.fill" : themePreference === 'dark' ? "moon.fill" : "gearshape.fill"} 
                size={22} 
                color={colors.secondaryText} 
              />
            </Pressable>
          </View>
        </View>

        {streaks.length > 0 && (
          <View style={styles.searchAndSortContainer}>
            {/* Search Bar */}
            <View style={dynamicStyles.searchContainer}>
              <IconSymbol name="magnifyingglass" size={18} color={colors.secondaryText} />
              <TextInput
                style={dynamicStyles.searchInput}
                placeholder="Search streaks..."
                placeholderTextColor={colors.secondaryText}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <IconSymbol name="xmark.circle.fill" size={18} color={colors.secondaryText} />
                </Pressable>
              )}
            </View>

            {/* Sort Button */}
            <Pressable 
              style={dynamicStyles.sortButton}
              onPress={() => setShowSortModal(true)}
            >
              <IconSymbol name="arrow.up.arrow.down" size={16} color={colors.secondaryText} />
              <Text style={dynamicStyles.sortButtonText}>
                {sortOption === 'highest' ? 'Highest' :
                 sortOption === 'newest' ? 'Newest' :
                 sortOption === 'oldest' ? 'Oldest' : 'Name'}
              </Text>
            </Pressable>
          </View>
        )}

        {streaks.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="flame" size={64} color={colors.secondaryText} />
            <Text style={dynamicStyles.emptyText}>No streaks yet</Text>
            <Text style={dynamicStyles.emptySubtext}>Create your first streak to get started!</Text>
          </View>
        ) : (
          <View style={styles.streaksList}>
            {filteredStreaks.length === 0 && searchQuery ? (
              <View style={styles.emptySearchState}>
                <Text style={dynamicStyles.emptySearchText}>No streaks found</Text>
                <Text style={dynamicStyles.emptySearchSubtext}>Try a different search term</Text>
      </View>
            ) : (
              filteredStreaks.map((streak) => {
              const progress = streak.targetDays 
                ? Math.round((streak.streak / streak.targetDays) * 100) 
                : null;
              const currentMilestone = getCurrentMilestone(streak.streak);

  return (
                <Pressable
                  key={streak.id}
                  style={[dynamicStyles.streakCard, { borderLeftColor: streak.color || STREAK_COLORS[0] }]}
                  onPress={() => handleStreakPress(streak.id)}
                >
                  <View style={styles.streakCardContent}>
                    <View style={styles.streakNameRow}>
                      <Text style={dynamicStyles.streakName}>{streak.name}</Text>
                      {currentMilestone && (
                        <View style={[dynamicStyles.milestoneBadgeSmall, { borderColor: currentMilestone.color }]}>
                          <Text style={styles.milestoneEmojiSmall}>{currentMilestone.emoji}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.streakInfo}>
                      <Text style={[styles.streakCount, { color: colors.success }]}>🔥 {streak.streak}</Text>
                      <Text style={dynamicStyles.streakDays}>{streak.doneDates.length} days</Text>
                    </View>
                    {streak.targetDays && (
                      <View style={styles.targetInfo}>
                        <View style={dynamicStyles.targetProgressBar}>
                          <View 
                            style={[
                              styles.targetProgressFill,
                              {
                                width: `${Math.min(progress || 0, 100)}%`,
                                backgroundColor: streak.color || STREAK_COLORS[0],
                              }
                            ]}
                          />
                        </View>
                        <Text style={dynamicStyles.targetText}>
                          {progress}% • {streak.targetDays - streak.streak} days left
                        </Text>
                      </View>
                    )}
                  </View>
                  <IconSymbol name="chevron.right" size={20} color={colors.secondaryText} />
                </Pressable>
              );
              })
            )}
          </View>
        )}

        <Pressable
          style={[styles.addButton, { backgroundColor: colors.success }]}
          onPress={() => setShowAddModal(true)}
        >
          <IconSymbol name="plus.circle.fill" size={24} color={isDark ? colors.text : '#0f0f0f'} />
          <Text style={[styles.addButtonText, { color: isDark ? colors.text : '#0f0f0f' }]}>New Streak</Text>
        </Pressable>
      </ScrollView>

      {/* Add Streak Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          style={dynamicStyles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <Pressable
            style={dynamicStyles.modalOverlay}
            onPress={() => {
              setShowAddModal(false);
              setNewStreakName('');
            }}
          >
            <Pressable
              style={dynamicStyles.modalContent}
              onPress={(e) => e.stopPropagation()}
            >
              <Text style={dynamicStyles.modalTitle}>Create New Streak</Text>
              <TextInput
                style={dynamicStyles.input}
                placeholder="e.g., Exercise, Study, Reading..."
                placeholderTextColor={colors.secondaryText}
                value={newStreakName}
                onChangeText={setNewStreakName}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleAddStreak}
              />
              <View style={styles.modalButtons}>
                <Pressable
                  style={[styles.modalButton, dynamicStyles.cancelButton]}
                  onPress={() => {
                    setShowAddModal(false);
                    setNewStreakName('');
                  }}
                >
                  <Text style={dynamicStyles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalButton, dynamicStyles.createButton]}
                  onPress={handleAddStreak}
                >
                  <Text style={dynamicStyles.createButtonText}>Create</Text>
                </Pressable>
    </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Sort Modal */}
      <Modal
        visible={showSortModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSortModal(false)}
      >
        <Pressable 
          style={dynamicStyles.modalOverlay}
          onPress={() => setShowSortModal(false)}
        >
          <Pressable 
            style={dynamicStyles.sortModal}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={dynamicStyles.modalTitle}>Sort By</Text>
            {(['highest', 'newest', 'oldest', 'name'] as SortOption[]).map((option) => (
              <Pressable
                key={option}
                style={[
                  dynamicStyles.sortOption,
                  sortOption === option && dynamicStyles.sortOptionSelected,
                ]}
                onPress={() => {
                  setSortOption(option);
                  setShowSortModal(false);
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }}
              >
                <Text style={[
                  dynamicStyles.sortOptionText,
                  sortOption === option && dynamicStyles.sortOptionTextSelected,
                ]}>
                  {option === 'highest' ? '🔥 Highest Streak' :
                   option === 'newest' ? '🆕 Newest First' :
                   option === 'oldest' ? '📅 Oldest First' : '🔤 Name (A-Z)'}
                </Text>
                {sortOption === option && (
                  <IconSymbol name="checkmark" size={18} color={colors.success} />
                )}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 100 },
  header: { marginBottom: 20 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTextContainer: {
    flex: 1,
  },
  themeButton: {
    padding: 8,
    borderRadius: 8,
  },
  searchAndSortContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptySearchState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  streaksList: { gap: 12, marginBottom: 20 },
  streakCardContent: { flex: 1 },
  streakNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  milestoneEmojiSmall: { fontSize: 14 },
  streakInfo: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  streakCount: { fontSize: 16, fontWeight: '700' },
  targetInfo: { marginTop: 8 },
  targetProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  addButton: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  addButtonText: { fontSize: 16, fontWeight: '700' },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalButton: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
});
