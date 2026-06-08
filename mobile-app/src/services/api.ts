import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';

const API_HOST = process.env.EXPO_PUBLIC_API_HOST || '192.168.1.132';
const API_PORT = process.env.EXPO_PUBLIC_API_PORT || '5000';

const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    const hostname = typeof window !== 'undefined' && window.location ? window.location.hostname : 'localhost';
    return `http://${hostname}:5000`;
  }

  // Detect Metro host IP dynamically from Expo Constants
  const hostUri = Constants.expoConfig?.hostUri; // e.g. "192.168.1.132:8081"
  let metroIp = '';
  if (hostUri) {
    metroIp = hostUri.split(':')[0];
  }

  // Determine fallback IP based on platform and emulator/device status
  const isEmulator = !Device.isDevice;
  const fallbackHost = (Platform.OS === 'android' && isEmulator) 
    ? '10.0.2.2' 
    : (API_HOST || '192.168.1.132');

  const finalHost = metroIp || fallbackHost;

  return `http://${finalHost}:${API_PORT}`;
};

export const BASE_URL = getBaseUrl();
export const PREDICT_ENDPOINT = `${BASE_URL}/predict`;

const TIMEOUT_MS = 15000;

const getFileName = (imageUri) => {
  const uriParts = imageUri.split('/');
  const name = uriParts[uriParts.length - 1] || 'image.jpg';
  return name;
};

const getMimeType = (filename) => {
  const extension = filename.split('.').pop()?.toLowerCase();
  if (extension === 'png') return 'image/png';
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg';
  if (extension === 'webp') return 'image/webp';
  return 'image/jpeg';
};

const createMultipartBody = async (imageUri, userId?: string) => {
  const formData = new FormData();
  const filename = getFileName(imageUri);
  const mimeType = getMimeType(filename);

  if (Platform.OS === 'web') {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    formData.append('image', blob, filename);
  } else {
    formData.append('image', {
      uri: imageUri,
      name: filename,
      type: mimeType,
    } as any);
  }

  if (userId) {
    formData.append('user_id', userId);
  }

  return formData;
};

// --- Predict Disease ---
export const predictDisease = async (imageUri: string, userId?: string) => {
  try {
    const formData = await createMultipartBody(imageUri, userId);

    console.log('[API] Sending prediction request', {
      platform: Platform.OS,
      endpoint: PREDICT_ENDPOINT,
      imageUri,
      userId,
    });

    let responseStatus = 0;
    let responseText = '';
    let responseOk = false;

    if (Platform.OS === 'web') {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
      try {
        const response = await fetch(PREDICT_ENDPOINT, {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        responseStatus = response.status;
        responseText = await response.text();
        responseOk = response.ok;
      } catch (err) {
        clearTimeout(timeoutId);
        throw err;
      }
    } else {
      // Native workaround: use XMLHttpRequest to bypass React Native 0.85+ fetch bug
      const xhrResult = await new Promise<{ ok: boolean; status: number; text: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', PREDICT_ENDPOINT);
        xhr.timeout = TIMEOUT_MS;

        xhr.onload = () => {
          resolve({
            ok: xhr.status >= 200 && xhr.status < 300,
            status: xhr.status,
            text: xhr.responseText,
          });
        };

        xhr.onerror = () => {
          reject(new Error('Network request failed'));
        };

        xhr.ontimeout = () => {
          reject(new Error('Request timed out. Check your backend server and network connection.'));
        };

        xhr.send(formData as any);
      });

      responseStatus = xhrResult.status;
      responseText = xhrResult.text;
      responseOk = xhrResult.ok;
    }

    console.log('[API] Response status', responseStatus);

    if (!responseOk) {
      let errorMessage = `Server error: ${responseStatus}`;
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (_error) {
        errorMessage = responseText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (_error) {
      throw new Error('Invalid JSON response from server');
    }

    return {
      prediction: data.prediction || 'Unknown',
      confidence: Number.parseFloat(data.confidence) || 0,
      crop: data.crop || 'Unknown',
      disease: data.disease || 'Unknown',
      cause: data.cause || 'Information not available.',
      prevention: Array.isArray(data.prevention) 
        ? data.prevention 
        : [data.prevention || 'No specific prevention tips available.'],
      imageUrl: data.image_url ? `${BASE_URL}/${data.image_url}` : null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API] Prediction request failed', { error: message });

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out. Check your backend server and network connection.');
    }
    if (message.includes('Network request failed') || message.includes('Failed to fetch')) {
      throw new Error('Network error. Make sure the Flask backend is running and reachable.');
    }
    throw error;
  }
};

// --- Authentication services ---
export const registerUser = async (username, email, password) => {
  try {
    const response = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }
    return data;
  } catch (err) {
    throw new Error(err.message || 'Error occurred during registration');
  }
};

export const loginUser = async (email, password) => {
  try {
    const response = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }
    return data;
  } catch (err) {
    throw new Error(err.message || 'Error occurred during login');
  }
};

export const updateSettings = async (userId, username, password) => {
  try {
    const response = await fetch(`${BASE_URL}/update-settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, username, password }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update settings');
    }
    return data;
  } catch (err) {
    throw new Error(err.message || 'Error updating settings');
  }
};

// --- Farms CRUD ---
export const getFarms = async (userId) => {
  try {
    const response = await fetch(`${BASE_URL}/farms?user_id=${userId}`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch farms');
    }
    return data.farms || [];
  } catch (err) {
    throw new Error(err.message || 'Error fetching farms');
  }
};

export const addFarm = async (userId, name, cropType, areaSize) => {
  try {
    const response = await fetch(`${BASE_URL}/farms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, name, crop_type: cropType, area_size: areaSize }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create farm');
    }
    return data.farm;
  } catch (err) {
    throw new Error(err.message || 'Error creating farm');
  }
};

export const deleteFarm = async (farmId) => {
  try {
    const response = await fetch(`${BASE_URL}/farms/${farmId}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete farm');
    }
    return data;
  } catch (err) {
    throw new Error(err.message || 'Error deleting farm');
  }
};

// --- Support ticket contact ---
export const submitSupportTicket = async (userId, subject, message) => {
  try {
    const response = await fetch(`${BASE_URL}/support`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, subject, message }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to submit support ticket');
    }
    return data;
  } catch (err) {
    throw new Error(err.message || 'Error submitting support ticket');
  }
};

// --- Dynamic user history ---
export const getUserScans = async (userId) => {
  try {
    const response = await fetch(`${BASE_URL}/scans?user_id=${userId}`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch scan logs');
    }
    const rawScans = data.scans || [];
    return rawScans.map((r) => ({
      ...r,
      image_path: r.image_path ? `${BASE_URL}/${r.image_path}` : null,
    }));
  } catch (err) {
    throw new Error(err.message || 'Error fetching scan logs');
  }
};
