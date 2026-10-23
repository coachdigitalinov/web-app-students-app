// Month calendar highlighting today and days with scheduled upcoming events.
export function MiniCalendar({ busyDays }: { busyDays: Set<string> }) {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth();
  const first = new Date(y, m, 1);
  const start = new Date(first);
  start.setDate(1 - ((first.getDay() + 6) % 7)); // Monday-first grid
  const days: { d: number; off: boolean; iso: string; today: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const dt = new Date(start);
    dt.setDate(start.getDate() + i);
    const iso = dt.toISOString().slice(0, 10);
    days.push({
      d: dt.getDate(),
      off: dt.getMonth() !== m,
      iso,
      today: dt.toDateString() === now.toDateString(),
    });
  }
  const dow = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
  const monthName = now.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  return (
    <div>
      <div className="cal-head">
        <b style={{ fontSize: 14 }}>{monthName}</b>
      </div>
      <div className="cal" role="grid">
        {dow.map((d) => <div key={d} className="d muted" style={{ fontSize: 11 }}>{d}</div>)}
        {days.map((x, i) => (
          <div key={i} className={`d ${x.off ? "off" : ""} ${x.today ? "today" : busyDays.has(x.iso) ? "has" : ""}`}>
            <small>&nbsp;</small>{x.d}
          </div>
        ))}
      </div>
    </div>
  );
}
