# Data Storage & Persistence Guide

## 📍 Where Data is Stored

Your streak data is stored **locally on your device** using `AsyncStorage`. This means:

- ✅ **Data persists** when you close the app
- ✅ **Data persists** when you restart your device
- ✅ **Data is private** - only stored on your device
- ❌ **Data is NOT synced** across devices (if you use the app on multiple devices)
- ❌ **Data can be lost** if you uninstall the app

### Platform-Specific Storage Locations

- **iOS**: Stored in `NSUserDefaults` (plist files in app's sandbox)
- **Android**: Stored in `SharedPreferences` (XML files in app's data directory)
- **Web**: Stored in browser's `localStorage`

## 💾 What Data is Stored

The app stores data in JSON format with the key `@streak_data`:

```json
{
  "doneDates": [
    "Mon Jan 15 2024",
    "Tue Jan 16 2024",
    "Wed Jan 17 2024"
  ],
  "streak": 3
}
```

### Data Structure

- **`doneDates`**: Array of date strings (all completed days)
- **`streak`**: Current streak count (calculated from doneDates)

## 🔄 How Data Persistence Works

### 1. **Saving Data** (When you mark a day as done)

```typescript
// In index.tsx - handleDone function
const newDoneDates = [...doneDates, today];
await AsyncStorage.setItem(
  STORAGE_KEY,
  JSON.stringify({ doneDates: newDoneDates, streak: newStreak })
);
```

**When**: Every time you press "DONE TODAY" button
**What happens**: 
- Adds today's date to `doneDates` array
- Calculates new streak
- Saves entire data object to AsyncStorage

### 2. **Loading Data** (When app starts)

```typescript
// In index.tsx - useEffect on mount
const json = await AsyncStorage.getItem(STORAGE_KEY);
const data = JSON.parse(json);
setDoneDates(data.doneDates);
setStreak(calculateStreak(data.doneDates));
```

**When**: 
- App starts (useEffect on component mount)
- Screen is focused (useFocusEffect in MiniCalendar and Explore)

**What happens**:
- Reads data from AsyncStorage
- Parses JSON
- Updates component state
- Calculates streak from dates

### 3. **Data Migration** (Backward Compatibility)

The app automatically migrates old data format to new format:

```typescript
// Old format: { streak: 5, lastDate: "Mon Jan 15 2024" }
// New format: { doneDates: [...], streak: 5 }
```

## 🔐 Data Security & Privacy

- **Local Only**: Data never leaves your device
- **No Cloud Sync**: Data is not backed up to cloud (unless device backup is enabled)
- **No Account Required**: No login or account needed
- **Device-Specific**: Each device has its own data

## ⚠️ Important Notes

### Data Loss Scenarios

1. **Uninstalling the app** → All data is deleted
2. **Clearing app data** (Android) → All data is deleted
3. **Resetting device** → All data is deleted
4. **App cache/data cleared** → All data is deleted

### Data Backup Options

Currently, the app does NOT have built-in cloud backup. Your data is only backed up if:
- **iOS**: iCloud backup is enabled (automatic)
- **Android**: Google backup is enabled (automatic)

## 🛠️ Utility Functions

We've created centralized storage functions in `utils/storage.ts`:

- `loadStreakData()` - Load data from storage
- `saveStreakData(data)` - Save data to storage
- `clearStreakData()` - Clear all data (for reset functionality)

## 📊 Example Data Flow

```
User presses "DONE TODAY"
    ↓
Add today to doneDates array
    ↓
Calculate new streak
    ↓
Save to AsyncStorage (JSON.stringify)
    ↓
Data persisted on device
    ↓
Next time app opens:
    ↓
Load from AsyncStorage (JSON.parse)
    ↓
Display streak and calendar
```

## 🔍 Debugging Storage

To check stored data (development only):

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get all keys
const keys = await AsyncStorage.getAllKeys();
console.log('Storage keys:', keys);

// Get streak data
const data = await AsyncStorage.getItem('@streak_data');
console.log('Streak data:', JSON.parse(data));
```

## 🚀 Future Improvements

Potential enhancements for data persistence:

1. **Cloud Sync**: Sync data across devices (Firebase, Supabase, etc.)
2. **Export/Import**: Allow users to export data as JSON
3. **Backup Reminder**: Notify users to backup their data
4. **Data Recovery**: Recover data from device backups
