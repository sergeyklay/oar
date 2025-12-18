export const RANGE_KEYS = ['0', '1', '3', '5', '7', '10', '14', '20', '30'] as const;

export const ALLOWED_RANGE_VALUES = [0, 1, 3, 5, 7, 10, 14, 20, 30] as const;

export const RANGE_LABELS: Record<string, string> = {
  '0': 'Today',
  '1': 'Today or tomorrow',
  '3': 'In next 3 days',
  '5': 'In next 5 days',
  '7': 'In next 7 days',
  '10': 'In next 10 days',
  '14': 'In next 14 days',
  '20': 'In next 20 days',
  '30': 'In next 30 days',
};

