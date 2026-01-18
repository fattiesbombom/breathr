// Timer constants
export const BREATHE_TIMER = 5; // 10 seconds for breathing screen
export const ALERT_TIMER = 20;   // 60 seconds for alerting screen before REST
export const NOTIFICATION_INTERVAL = 1000; // 1 second

// Cycling messages for alerts
export const ALERT_MESSAGES = [
  "MOMMY HELP",
  "I CANT BREATHE", 
  "PLS PICK ME UP IM SCARED",
  "OIIIIIIII",
  "HELP ME PLS 😭",
];

// App status enum
export enum AppStatus {
  SETUP = 'SETUP',
  WAITING = 'WAITING',
  MONITORING = 'MONITORING',
  ALERTING = 'ALERTING',
  REST = 'REST',
  SETTINGS = 'SETTINGS',
}
