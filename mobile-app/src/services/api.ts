import { Platform } from 'react-native';

const API_HOST = process.env.EXPO_PUBLIC_API_HOST || '192.168.1.132';
const API_PORT = process.env.EXPO_PUBLIC_API_PORT || '5000';

const getBaseUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000';
  }

  return `http://${API_HOST}:${API_PORT}`;
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

const createMultipartBody = async (imageUri) => {
  const formData = new FormData();
  const filename = getFileName(imageUri);
  const mimeType = getMimeType(filename);

  if (Platform.OS === 'web') {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    formData.append('image', blob, filename);
    return formData;
  }

  formData.append('image', {
    uri: imageUri,
    name: filename,
    type: mimeType,
  });

  return formData;
};

export const predictDisease = async (imageUri) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const formData = await createMultipartBody(imageUri);

    console.log('[API] Sending prediction request', {
      platform: Platform.OS,
      endpoint: PREDICT_ENDPOINT,
      imageUri,
    });

    const response = await fetch(PREDICT_ENDPOINT, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseText = await response.text();
    console.log('[API] Response status', response.status);
    console.log('[API] Response body', responseText);

    if (!response.ok) {
      let errorMessage = `Server error: ${response.status}`;
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
    clearTimeout(timeoutId);

    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API] Prediction request failed', {
      endpoint: PREDICT_ENDPOINT,
      platform: Platform.OS,
      imageUri,
      error: message,
    });

    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Check your backend server and network connection.');
    }

    if (message.includes('Network request failed') || message.includes('Failed to fetch')) {
      throw new Error('Network error. Make sure the Flask backend is running and reachable.');
    }

    throw error;
  }
};
