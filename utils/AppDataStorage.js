import AsyncStorage from '@react-native-async-storage/async-storage';

// Save data (key-value)
export const storeAppData = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.log('Storage error:', e);
  }
};

// Get data
export const getAppData = async (key) => {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (e) {
    console.log('Read error:', e);
    return null;
  }
};

// Remove data
export const removeAppData = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.log('Remove error:', e);
  }
};
