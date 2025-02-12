import { Observable } from '@nativescript/core';
import { database } from './services/database.service';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, addWeeks, addMonths, addYears, subWeeks, subMonths, subYears } from 'date-fns';
import { ENERGY_CATEGORIES } from './models/energy-entry';
import * as fs from '@nativescript/core/file-system';
import { knownFolders } from '@nativescript/core';

export class StatsViewModel extends Observable {
    private _timeRangeIndex: number = 0;
    private _currentDate: Date = new Date();
    private _periodEntries: any[] = [];
    private _categoryDistribution: any[] = [];
    private _timeOfDayAnalysis: any[] = [];
    private _averageEnergy: string = '0';
    private _peakEnergy: string = '0';
    private _lowestEnergy: string = '0';
    private _periodLabel: string = '';

    constructor() {
        super();
        this.loadData();
    }

    get timeRangeIndex(): number {
        return this._timeRangeIndex;
    }

    set timeRangeIndex(value: number) {
        if (this._timeRangeIndex !== value) {
            this._timeRangeIndex = value;
            this.notifyPropertyChange('timeRangeIndex', value);
            this.loadData();
        }
    }

    get periodLabel(): string {
        return this._periodLabel;
    }

    set periodLabel(value: string) {
        if (this._periodLabel !== value) {
            this._periodLabel = value;
            this.notifyPropertyChange('periodLabel', value);
        }
    }

    get periodEntries(): any[] {
        return this._periodEntries;
    }

    set periodEntries(value: any[]) {
        this._periodEntries = value;
        this.notifyPropertyChange('periodEntries', value);
    }

    get categoryDistribution(): any[] {
        return this._categoryDistribution;
    }

    set categoryDistribution(value: any[]) {
        this._categoryDistribution = value;
        this.notifyPropertyChange('categoryDistribution', value);
    }

    get timeOfDayAnalysis(): any[] {
        return this._timeOfDayAnalysis;
    }

    set timeOfDayAnalysis(value: any[]) {
        this._timeOfDayAnalysis = value;
        this.notifyPropertyChange('timeOfDayAnalysis', value);
    }

    get averageEnergy(): string {
        return this._averageEnergy;
    }

    set averageEnergy(value: string) {
        if (this._averageEnergy !== value) {
            this._averageEnergy = value;
            this.notifyPropertyChange('averageEnergy', value);
        }
    }

    get peakEnergy(): string {
        return this._peakEnergy;
    }

    set peakEnergy(value: string) {
        if (this._peakEnergy !== value) {
            this._peakEnergy = value;
            this.notifyPropertyChange('peakEnergy', value);
        }
    }

    get lowestEnergy(): string {
        return this._lowestEnergy;
    }

    set lowestEnergy(value: string) {
        if (this._lowestEnergy !== value) {
            this._lowestEnergy = value;
            this.notifyPropertyChange('lowestEnergy', value);
        }
    }

    private getDateRange(): { start: Date; end: Date } {
        switch (this.timeRangeIndex) {
            case 0: // Week
                return {
                    start: startOfWeek(this._currentDate),
                    end: endOfWeek(this._currentDate)
                };
            case 1: // Month
                return {
                    start: startOfMonth(this._currentDate),
                    end: endOfMonth(this._currentDate)
                };
            case 2: // Year
                return {
                    start: startOfYear(this._currentDate),
                    end: endOfYear(this._currentDate)
                };
            default:
                return {
                    start: startOfWeek(this._currentDate),
                    end: endOfWeek(this._currentDate)
                };
        }
    }

    async loadData() {
        const { start, end } = this.getDateRange();
        const entries = await database.getEntries(start.getTime(), end.getTime());

        // Update period label
        this.updatePeriodLabel(start, end);

        // Process entries for visualization
        this.processEntries(entries);

        // Calculate statistics
        this.calculateStatistics(entries);

        // Process category distribution
        this.processCategoryDistribution(entries);

        // Process time of day analysis
        this.processTimeOfDayAnalysis(entries);
    }

    private updatePeriodLabel(start: Date, end: Date) {
        switch (this.timeRangeIndex) {
            case 0:
                this.periodLabel = `Week of ${format(start, 'MMM d, yyyy')}`;
                break;
            case 1:
                this.periodLabel = format(start, 'MMMM yyyy');
                break;
            case 2:
                this.periodLabel = format(start, 'yyyy');
                break;
        }
    }

    private processEntries(entries: any[]) {
        this.periodEntries = entries.map(entry => ({
            time: format(new Date(entry.timestamp), this.timeRangeIndex === 0 ? 'EEE' : 'MMM d'),
            level: entry.level
        }));
    }

    private calculateStatistics(entries: any[]) {
        if (entries.length === 0) {
            this.averageEnergy = '0';
            this.peakEnergy = '0';
            this.lowestEnergy = '0';
            return;
        }

        const levels = entries.map(e => e.level);
        const avg = levels.reduce((a, b) => a + b, 0) / levels.length;
        const peak = Math.max(...levels);
        const lowest = Math.min(...levels);

        this.averageEnergy = avg.toFixed(1);
        this.peakEnergy = peak.toString();
        this.lowestEnergy = lowest.toString();
    }

    private processCategoryDistribution(entries: any[]) {
        const distribution = {};
        Object.values(ENERGY_CATEGORIES).forEach(cat => {
            distribution[cat.label] = 0;
        });

        entries.forEach(entry => {
            distribution[entry.category]++;
        });

        this.categoryDistribution = Object.entries(distribution).map(([category, count]) => ({
            category,
            count
        }));
    }

    private processTimeOfDayAnalysis(entries: any[]) {
        const hourlyData = {};
        for (let i = 0; i < 24; i++) {
            hourlyData[i] = { sum: 0, count: 0 };
        }

        entries.forEach(entry => {
            const hour = new Date(entry.timestamp).getHours();
            hourlyData[hour].sum += entry.level;
            hourlyData[hour].count++;
        });

        this.timeOfDayAnalysis = Object.entries(hourlyData).map(([hour, data]) => ({
            hour: `${hour}:00`,
            average: data.count > 0 ? data.sum / data.count : 0
        }));
    }

    previousPeriod() {
        switch (this.timeRangeIndex) {
            case 0:
                this._currentDate = subWeeks(this._currentDate, 1);
                break;
            case 1:
                this._currentDate = subMonths(this._currentDate, 1);
                break;
            case 2:
                this._currentDate = subYears(this._currentDate, 1);
                break;
        }
        this.loadData();
    }

    nextPeriod() {
        switch (this.timeRangeIndex) {
            case 0:
                this._currentDate = addWeeks(this._currentDate, 1);
                break;
            case 1:
                this._currentDate = addMonths(this._currentDate, 1);
                break;
            case 2:
                this._currentDate = addYears(this._currentDate, 1);
                break;
        }
        this.loadData();
    }

    async exportData() {
        const csvContent = await database.exportToCSV();
        const documentsFolder = knownFolders.documents();
        const filePath = fs.path.join(documentsFolder.path, 'energy_data.csv');
        const file = fs.File.fromPath(filePath);
        await file.writeText(csvContent);
        
        // Show success message or share file
        // Implementation depends on platform-specific sharing capabilities
    }
}