export function formatDate(raw: string, locale = "pt-PT") {
  const [year, month, day] = raw.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    year: "numeric",
    month: "long", // "August"
    day: "numeric", // "19"
  }).format(date);
}
