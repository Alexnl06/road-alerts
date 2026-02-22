import { base44 } from '@/api/base44Client';

/**
 * Central API caller that handles structured errors from backend functions
 * Throws meaningful errors with all details for debugging
 */
export async function apiCall(functionName, payload = {}) {
  try {
    const response = await base44.functions.invoke(functionName, payload);
    
    // Check if response has structured error
    if (response.data && response.data.ok === false) {
      const error = new Error(response.data.error || 'API_ERROR');
      error.code = response.data.error;
      error.status = response.data.status || response.status;
      error.details = response.data.details || 'No details provided';
      error.payload = payload;
      error.functionName = functionName;
      throw error;
    }
    
    // Return the data payload
    return response.data?.data || response.data;
  } catch (error) {
    // If it's already our structured error, rethrow
    if (error.code) throw error;
    
    // Otherwise wrap it
    const wrappedError = new Error('NETWORK_ERROR');
    wrappedError.code = 'NETWORK_ERROR';
    wrappedError.status = error.response?.status || 500;
    wrappedError.details = error.message;
    wrappedError.payload = payload;
    wrappedError.functionName = functionName;
    throw wrappedError;
  }
}

/**
 * Parse API error for display
 */
export function parseApiError(error) {
  if (!error) return { title: 'Unknown Error', message: '', details: '' };
  
  return {
    code: error.code || 'UNKNOWN_ERROR',
    status: error.status || 500,
    title: getErrorTitle(error.code),
    message: getErrorMessage(error.code),
    details: error.details || error.message || '',
    payload: error.payload,
    functionName: error.functionName,
  };
}

function getErrorTitle(code) {
  const titles = {
    'TOMTOM_API_KEY_MISSING': 'API Key ontbreekt',
    'TOMTOM_RATE_LIMIT': 'Te veel aanvragen',
    'TOMTOM_HTTP_ERROR': 'TomTom API fout',
    'TOMTOM_PARSE_ERROR': 'Antwoord niet leesbaar',
    'NO_ROUTES_FOUND': 'Geen route gevonden',
    'MISSING_COORDINATES': 'Coordinaten ontbreken',
    'NETWORK_ERROR': 'Netwerkfout',
    'INTERNAL_ERROR': 'Interne fout',
  };
  return titles[code] || 'Er ging iets mis';
}

function getErrorMessage(code) {
  const messages = {
    'TOMTOM_API_KEY_MISSING': 'De TomTom API key is niet ingesteld in de app instellingen.',
    'TOMTOM_RATE_LIMIT': 'Er zijn te veel aanvragen gedaan. Wacht even en probeer opnieuw.',
    'TOMTOM_HTTP_ERROR': 'De TomTom service gaf een foutmelding.',
    'TOMTOM_PARSE_ERROR': 'Het antwoord van TomTom kon niet worden gelezen.',
    'NO_ROUTES_FOUND': 'Er kon geen route gevonden worden tussen deze locaties.',
    'MISSING_COORDINATES': 'Start- of eindlocatie ontbreekt.',
    'NETWORK_ERROR': 'Kan geen verbinding maken met de server.',
    'INTERNAL_ERROR': 'Er is een onverwachte fout opgetreden.',
  };
  return messages[code] || 'Probeer het later opnieuw.';
}