import { UserName, UserStorage, UserData } from '../types';

const STORAGE_KEY = 'pole-analyzer-storage';

// Initialize storage with default values if it doesn't exist
export const initializeStorage = (): UserStorage => {
  const defaultStorage: UserStorage = {
    selectedUser: 'Riley', // Default to first user
    userData: {}
  };

  const existingStorage = localStorage.getItem(STORAGE_KEY);
  if (!existingStorage) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultStorage));
    return defaultStorage;
  }

  try {
    return JSON.parse(existingStorage) as UserStorage;
  } catch (error) {
    console.error('Error parsing storage, resetting to default', error);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultStorage));
    return defaultStorage;
  }
};

// Get the full storage object
export const getStorage = (): UserStorage => {
  const storage = localStorage.getItem(STORAGE_KEY);
  if (!storage) {
    return initializeStorage();
  }
  
  try {
    return JSON.parse(storage) as UserStorage;
  } catch (error) {
    console.error('Error parsing storage', error);
    return initializeStorage();
  }
};

// Save the storage object
export const saveStorage = (storage: UserStorage): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
};

// Get selected user
export const getSelectedUser = (): UserName => {
  const storage = getStorage();
  return storage.selectedUser;
};

// Set selected user
export const setSelectedUser = (username: UserName): void => {
  const storage = getStorage();
  storage.selectedUser = username;
  saveStorage(storage);
};

// Get user data
export const getUserData = (username: UserName): UserData | undefined => {
  const storage = getStorage();
  return storage.userData[username];
};

// Save user data
export const saveUserData = (username: UserName, data: UserData): void => {
  const storage = getStorage();
  storage.userData[username] = data;
  saveStorage(storage);
};

// Clear user data for a specific user
export const clearUserData = (username: UserName): void => {
  const storage = getStorage();
  delete storage.userData[username];
  saveStorage(storage);
};

// Clear all user data
export const clearAllUserData = (): void => {
  const storage = getStorage();
  storage.userData = {};
  saveStorage(storage);
};
