import { getAuthToken as getTokenFromManager } from '../services/tokenManager';

// Re-export the centralized token management function
export const getAuthToken = getTokenFromManager;
