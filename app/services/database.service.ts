import { Sqlite } from 'nativescript-sqlite';

export class DatabaseService {
  private database: Sqlite;

  async init(): Promise<void> {
    this.database = await new Sqlite('energy_tracker.db');
    await this.createTables();
  }

  private async createTables(): Promise<void> {
    await this.database.execSQL(`
      CREATE TABLE IF NOT EXISTS energy_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        level INTEGER NOT NULL,
        category TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        notes TEXT
      )
    `);
  }

  async addEntry(level: number, category: string, notes?: string): Promise<void> {
    const timestamp = Date.now();
    await this.database.execSQL(
      `INSERT INTO energy_entries (level, category, timestamp, notes) VALUES (?, ?, ?, ?)`,
      [level, category, timestamp, notes]
    );
  }

  async getEntries(startDate: number, endDate: number): Promise<any[]> {
    return await this.database.all(
      `SELECT * FROM energy_entries WHERE timestamp BETWEEN ? AND ? ORDER BY timestamp ASC`,
      [startDate, endDate]
    );
  }

  async exportToCSV(): Promise<string> {
    const entries = await this.database.all('SELECT * FROM energy_entries ORDER BY timestamp ASC');
    const header = 'Date,Time,Energy Level,Category,Notes\n';
    const rows = entries.map(entry => {
      const date = new Date(entry.timestamp);
      return `${date.toLocaleDateString()},${date.toLocaleTimeString()},${entry.level},${entry.category},"${entry.notes || ''}"\n`;
    });
    return header + rows.join('');
  }
}

export const database = new DatabaseService();