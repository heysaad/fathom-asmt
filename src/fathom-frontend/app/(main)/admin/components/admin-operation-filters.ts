export type AdminOperationFilters = {
  status?: string;
  drill_type?: string;
  dateFrom?: string;
  dateTo?: string;
  shipId?: string;
  userId?: string;
};

export function startOfDayFilter(value: string) {
  return value ? `${value}T00:00:00` : undefined;
}

export function endOfDayFilter(value: string) {
  return value ? `${value}T23:59:59` : undefined;
}

export function dateInputValue(value?: string) {
  return value?.slice(0, 10) ?? "";
}
