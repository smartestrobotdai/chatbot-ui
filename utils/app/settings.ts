import { Settings } from '@/types/settings';

const STORAGE_KEY = 'settings';

export const getSettings = (): Settings => {
  let settings: Settings = {
    theme: 'dark',
  };
  const settingsJson = localStorage.getItem(STORAGE_KEY);
  if (settingsJson) {
    try {
      let savedSettings = JSON.parse(settingsJson) as Settings;
      settings = Object.assign(settings, savedSettings);
    } catch (e) {
      console.error(e);
    }
  }
  return settings;
};

export const saveSettings = (settings: Settings) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};


export const getClientId = (): string => {
  let clientId = localStorage.getItem('clientId');
  if (!clientId) {
    clientId = Math.random().toString(36).substring(7);
    localStorage.setItem('clientId', clientId);
  }
  return clientId;
}