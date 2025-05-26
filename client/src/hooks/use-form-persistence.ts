import { useEffect, useCallback } from 'react';

export function useFormPersistence<T>(
  key: string,
  formData: T,
  interval: number = 30000 // 30 seconds
) {
  // Save to localStorage
  const saveToStorage = useCallback((data: T) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save form data to localStorage:', error);
    }
  }, [key]);

  // Load from localStorage
  const loadFromStorage = useCallback((): T | null => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('Failed to load form data from localStorage:', error);
      return null;
    }
  }, [key]);

  // Clear from localStorage
  const clearStorage = useCallback(() => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to clear form data from localStorage:', error);
    }
  }, [key]);

  // Auto-save effect
  useEffect(() => {
    const autoSave = setInterval(() => {
      if (formData && Object.keys(formData as any).length > 0) {
        saveToStorage(formData);
      }
    }, interval);

    return () => clearInterval(autoSave);
  }, [formData, saveToStorage, interval]);

  // Manual save
  const save = useCallback(() => {
    saveToStorage(formData);
  }, [formData, saveToStorage]);

  return {
    save,
    load: loadFromStorage,
    clear: clearStorage
  };
}
