// Mock web pour expo-sqlite
// SQLite n'est pas disponible sur web, ce mock permet à l'app de se charger sans crasher.

class MockSQLiteDatabase {
  async execAsync(_sql) {}
  async runAsync(_sql, _params) {
    return { changes: 0, lastInsertRowId: 0 };
  }
  async getFirstAsync(_sql, _params) {
    return null;
  }
  async getAllAsync(_sql, _params) {
    return [];
  }
  async closeAsync() {}
}

module.exports = {
  openDatabaseAsync: async (_name) => new MockSQLiteDatabase(),
  SQLiteDatabase: MockSQLiteDatabase,
};
