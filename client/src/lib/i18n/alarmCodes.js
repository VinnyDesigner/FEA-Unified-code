export const ALARM_CODE_I18N_KEYS = {
  COMM_LOST: 'alarms.codes.COMM_LOST',
  DOOR_OPEN: 'alarms.codes.DOOR_OPEN',
  GPS_LOST: 'alarms.codes.GPS_LOST',
  BATTERY_LOW: 'alarms.codes.BATTERY_LOW',
  SENSOR_FAULT: 'alarms.codes.SENSOR_FAULT',
  POWER_FAULT: 'alarms.codes.POWER_FAULT',
  THRESHOLD_EXCEEDED: 'alarms.codes.THRESHOLD_EXCEEDED',
  OFFLINE: 'alarms.codes.OFFLINE',
};

export function getAlarmLabel(code, t) {
  const key = ALARM_CODE_I18N_KEYS[code];
  return key ? t(key) : code;
}
