import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@streak_data';

export interface StreakItem {
  id: string; // Unique ID for each streak
  name: string; // Name of the streak (e.g., "Sigara Bırakma", "Ders Çalışma")
  doneDates: string[]; // Array of date strings (e.g., "Mon Jan 15 2024")
  streak: number; // Current streak count
  createdAt: string; // When the streak was created
  color?: string; // Optional color for the streak card
  targetDays?: number; // Optional target days (e.g., 30 days goal)
}

export interface StreakData {
  streaks: StreakItem[]; // Array of all streaks
}

// Legacy interface for backward compatibility
export interface LegacyStreakData {
  doneDates?: string[];
  streak?: number;
  lastDate?: string;
}

/**
 * Load streak data from AsyncStorage
 * Returns streaks array or empty array if no data exists
 */
export async function loadStreakData(): Promise<StreakItem[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (json) {
      const data = JSON.parse(json);
      
      // Handle new data structure (multiple streaks)
      if (data.streaks && Array.isArray(data.streaks)) {
        return data.streaks;
      }
      
      // Migrate from old single streak structure
      if (data.doneDates || data.lastDate) {
        const legacyData = data as LegacyStreakData;
        const doneDates = legacyData.doneDates || (legacyData.lastDate ? [legacyData.lastDate] : []);
        const streak = legacyData.streak || (doneDates.length > 0 ? 1 : 0);
        
        const migratedStreak: StreakItem = {
          id: 'default-streak',
          name: 'My Streak',
          doneDates,
          streak,
          createdAt: new Date().toISOString(),
        };
        
        const migratedData: StreakData = {
          streaks: [migratedStreak],
        };
        
        // Save migrated data
        await saveStreakData(migratedData);
        return [migratedStreak];
      }
    }
    return [];
  } catch (error) {
    console.error('Error loading streak data:', error);
    return [];
  }
}

/**
 * Save streak data to AsyncStorage
 * This persists data locally on the device
 */
export async function saveStreakData(data: StreakData): Promise<boolean> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error saving streak data:', error);
    return false;
  }
}

/**
 * Save all streaks
 */
export async function saveAllStreaks(streaks: StreakItem[]): Promise<boolean> {
  try {
    const data: StreakData = { streaks };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error saving streaks:', error);
    return false;
  }
}

/**
 * Add a new streak
 */
export async function addStreak(streak: StreakItem): Promise<boolean> {
  try {
    const streaks = await loadStreakData();
    streaks.push(streak);
    return await saveAllStreaks(streaks);
  } catch (error) {
    console.error('Error adding streak:', error);
    return false;
  }
}

/**
 * Update an existing streak
 */
export async function updateStreak(streakId: string, updates: Partial<StreakItem>): Promise<boolean> {
  try {
    const streaks = await loadStreakData();
    const index = streaks.findIndex(s => s.id === streakId);
    if (index === -1) return false;
    
    streaks[index] = { ...streaks[index], ...updates };
    return await saveAllStreaks(streaks);
  } catch (error) {
    console.error('Error updating streak:', error);
    return false;
  }
}

/**
 * Delete a streak
 */
export async function deleteStreak(streakId: string): Promise<boolean> {
  try {
    const streaks = await loadStreakData();
    const filtered = streaks.filter(s => s.id !== streakId);
    return await saveAllStreaks(filtered);
  } catch (error) {
    console.error('Error deleting streak:', error);
    return false;
  }
}

/**
 * Get a single streak by ID
 */
export async function getStreakById(streakId: string): Promise<StreakItem | null> {
  try {
    const streaks = await loadStreakData();
    return streaks.find(s => s.id === streakId) || null;
  } catch (error) {
    console.error('Error getting streak:', error);
    return null;
  }
}

/**
 * Clear all streak data
 */
export async function clearStreakData(): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing streak data:', error);
    return false;
  }
}

/**
 * Get the storage location info (for debugging/display)
 * Note: Actual file location varies by platform
 */
export function getStorageInfo(): {
  type: 'local';
  platform: 'ios' | 'android' | 'web';
  location: string;
} {
  // AsyncStorage uses platform-specific storage:
  // - iOS: Uses NSUserDefaults (plist files)
  // - Android: Uses SharedPreferences (XML files)
  // - Web: Uses localStorage (browser storage)
  
  return {
    type: 'local',
    platform: 'unknown' as any, // Would need Platform.OS to determine
    location: 'Device local storage (persists across app restarts)',
  };
}
