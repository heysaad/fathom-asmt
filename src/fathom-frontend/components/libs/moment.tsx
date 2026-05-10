import moment from "moment";

export function FromNow({ date, ago = false }: { date?: string | Date, ago?: boolean }) {
  if (!date) return <div>-</div>;

  const d = moment(date);
  const min = moment().add(-5, 'd')
  const max = moment().add(5, 'd')
  
  return <>{d.fromNow(ago)}</>;
}

export function DateFormat({ date, format = "DD MMM YYYY" }: { date?: string | Date, format?: string }) {
  if (!date) return <div>-</div>;
  const d = moment(date);
  return <>{d.format(format)}</>;
}

export function FromCalendar({ date }: { date?: string | Date }) {
  if (!date) return <div>-</div>;

  const d = moment(date);
  return <>{d.calendar()}</>;
}
