export const SIZE_UNITS = ['B', 'KB', 'MB', 'GB'] as const
export type SizeUnit = (typeof SIZE_UNITS)[number]

export const SIZE_UNIT_OPTIONS = SIZE_UNITS.map(unit => ({
  value: unit,
  label: unit,
}))
