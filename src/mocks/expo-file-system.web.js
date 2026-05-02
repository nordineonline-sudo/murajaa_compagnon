// Mock web pour expo-file-system
// expo-file-system n'est pas disponible sur web.

module.exports = {
  documentDirectory: null,
  getInfoAsync: async (_uri) => ({ exists: false, size: 0, isDirectory: false, modificationTime: 0, uri: _uri }),
  readAsStringAsync: async (_uri) => '',
  writeAsStringAsync: async (_uri, _contents) => {},
  deleteAsync: async (_uri) => {},
  makeDirectoryAsync: async (_uri) => {},
  createDownloadResumable: (_url, _fileUri, _options, _callback) => ({
    downloadAsync: async () => null,
    pauseAsync: async () => null,
    resumeAsync: async () => null,
  }),
  EncodingType: {
    UTF8: 'utf8',
    Base64: 'base64',
  },
};
