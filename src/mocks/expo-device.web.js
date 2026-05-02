// Mock web pour expo-device
// expo-device n'est pas disponible sur web — isDevice vaut false sur le web.

module.exports = {
  isDevice: false,
  brand: null,
  manufacturer: null,
  modelName: null,
  osName: 'Web',
  osVersion: null,
  deviceName: null,
  DeviceType: {
    UNKNOWN: 0,
    PHONE: 1,
    TABLET: 2,
    DESKTOP: 3,
    TV: 4,
  },
  deviceType: 3, // DESKTOP
};
