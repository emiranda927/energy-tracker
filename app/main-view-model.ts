import { Observable, Frame } from '@nativescript/core';
import { database } from './services/database.service';
import { notifications } from './services/notifications.service';
import { getEnergyCategory } from './models/energy-entry';
import { format } from 'date-fns';

export class EnergyTrackerModel extends Observable {
  private _energyLevel: number = 50;
  private _energyCategory: string = '';
  private _notes: string = '';
  private _todayEntries: any[] = [];
  private _todayAverage: string = '0';
  private _todayPeak: string = '0';
  private _todayLowest: string = '0';

  constructor() {
    super();
    this.initializeApp();
    this.updateEnergyCategory();
    this.loadTodayEntries();
  }

  private async initializeApp() {
    await database.init();
    await notifications.scheduleReminders();
  }

  get energyLevel(): number {
    return this._energyLevel;
  }

  set energyLevel(value: number) {
    if (this._energyLevel !== value) {
      this._energyLevel = value;
      this.notifyPropertyChange('energyLevel', value);
      this.updateEnergyCategory();
    }
  }

  get energyCategory(): string {
    return this._energyCategory;
  }

  set energyCategory(value: string) {
    if (this._energyCategory !== value) {
      this._energyCategory = value;
      this.notifyPropertyChange('energyCategory', value);
    }
  }

  get notes(): string {
    return this._notes;
  }

  set notes(value: string) {
    if (this._notes !== value) {
      this._notes = value;
      this.notifyPropertyChange('notes', value);
    }
  }

  get todayEntries(): any[] {
    return this._todayEntries;
  }

  set todayEntries(value: any[]) {
    this._todayEntries = value;
    this.notifyPropertyChange('todayEntries', value);
  }

  get todayAverage(): string {
    return this._todayAverage;
  }

  set todayAverage(value: string) {
    if (this._todayAverage !== value) {
      this._todayAverage = value;
      this.notifyPropertyChange('todayAverage', value);
    }
  }

  get todayPeak(): string {
    return this._todayPeak;
  }

  set todayPeak(value: string) {
    if (this._todayPeak !== value) {
      this._todayPeak = value;
      this.notifyPropertyChange('todayPeak', value);
    }
  }

  get todayLowest(): string {
    return this._todayLowest;
  }

  set todayLowest(value: string) {
    if (this._todayLowest !== value) {
      this._todayLowest = value;
      this.notifyPropertyChange('todayLowest', value);
    }
  }

  private updateEnergyCategory() {
    this.energyCategory = getEnergyCategory(this.energyLevel);
  }

  async saveEntry() {
    await database.addEntry(this.energyLevel, this.energyCategory, this.notes);
    this.notes = '';
    await this.loadTodayEntries();
  }

  async loadTodayEntries() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const entries = await database.getEntries(startOfDay.getTime(), endOfDay.getTime());
    
    this.todayEntries = entries.map(entry => ({
      time: format(new Date(entry.timestamp), 'HH:mm'),
      level: entry.level
    }));

    // Calculate statistics
    if (entries.length > 0) {
      const levels = entries.map(e => e.level);
      const avg = levels.reduce((a, b) => a + b, 0) / levels.length;
      const peak = Math.max(...levels);
      const lowest = Math.min(...levels);

      this.todayAverage = avg.toFixed(1);
      this.todayPeak = peak.toString();
      this.todayLowest = lowest.toString();
    }
  }

  showStats() {
    Frame.topmost().navigate({
      moduleName: 'stats-page',
      animated: true
    });
  }
}