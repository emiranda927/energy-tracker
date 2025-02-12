export interface EnergyEntry {
  id?: number;
  level: number;
  category: string;
  timestamp: number;
  notes?: string;
}

export const ENERGY_CATEGORIES = {
  VERY_LOW: { min: 0, max: 20, label: 'Very Low Energy' },
  LOW: { min: 21, max: 40, label: 'Low Energy' },
  NEUTRAL: { min: 41, max: 60, label: 'Neutral Energy' },
  HIGH: { min: 61, max: 80, label: 'High Energy' },
  VERY_HIGH: { min: 81, max: 100, label: 'Very High Energy' }
};

export function getEnergyCategory(level: number): string {
  for (const [key, value] of Object.entries(ENERGY_CATEGORIES)) {
    if (level >= value.min && level <= value.max) {
      return value.label;
    }
  }
  return ENERGY_CATEGORIES.NEUTRAL.label;
}