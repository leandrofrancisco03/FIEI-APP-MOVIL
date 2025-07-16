// Configuración de la aplicación

// N8N Webhook URL - Se obtiene desde las variables de entorno
export const WEBHOOK_URL = process.env.EXPO_PUBLIC_WEBHOOK_URL!

// Configuraciones adicionales que puedas necesitar
export const APP_CONFIG = {
  WEBHOOK_TIMEOUT: 40000, // 40 segundos
  CHAT_MAX_LENGTH: 500,
  
  // URLs
  WEBHOOK_URL: WEBHOOK_URL,
  
  // Configuraciones de chat
  CHAT_CONFIG: {
    MAX_MESSAGE_LENGTH: 500,
    TIMEOUT_MS: 30000,
    RETRY_ATTEMPTS: 3,
  }
} as const;

export default APP_CONFIG;
