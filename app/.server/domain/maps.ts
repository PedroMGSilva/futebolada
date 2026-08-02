export type Coordinates = {
  latitude: number;
  longitude: number;
};

const SHORT_LINK_HOSTS = new Set(["maps.app.goo.gl", "goo.gl"]);

const GOOGLE_MAPS_HOST =
  /^(?:(?:www|maps)\.)?google\.(?:com|[a-z]{2}|com?\.[a-z]{2})$/;

const COORDINATE_PARAMS = ["q", "query", "ll", "center", "destination", "sll"];

const NUMBER = String.raw`-?\d+(?:\.\d+)?`;
const PAIR = String.raw`(${NUMBER})\s*,\s*(${NUMBER})`;

const PLACE_PIN = new RegExp(String.raw`!3d(${NUMBER})!4d(${NUMBER})`);
const SEARCH_PATH = new RegExp(String.raw`/maps/search/${PAIR}`);
const VIEWPORT = new RegExp(String.raw`@${PAIR}`);
const PARAM_PAIR = new RegExp(String.raw`^\s*(?:loc:)?\s*${PAIR}\s*(?:\(|$)`);

function isAllowedHost(url: URL): boolean {
  return SHORT_LINK_HOSTS.has(url.host) || GOOGLE_MAPS_HOST.test(url.host);
}

function toCoordinates(
  latitude: string,
  longitude: string,
): Coordinates | null {
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;

  return { latitude: lat, longitude: lng };
}

function decode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function coordinatesFromUrl(url: URL): Coordinates | null {
  const text = decode(url.href).replace(/\+/g, " ");
  const isDirections = url.pathname.startsWith("/maps/dir");

  if (!isDirections) {
    for (const pattern of [PLACE_PIN, SEARCH_PATH]) {
      const match = text.match(pattern);
      const coordinates = match && toCoordinates(match[1], match[2]);
      if (coordinates) return coordinates;
    }
  }

  for (const param of COORDINATE_PARAMS) {
    const value = url.searchParams.get(param);
    const match = value?.match(PARAM_PAIR);
    const coordinates = match && toCoordinates(match[1], match[2]);
    if (coordinates) return coordinates;
  }

  if (isDirections) return null;

  const viewport = text.match(VIEWPORT);
  return (viewport && toCoordinates(viewport[1], viewport[2])) || null;
}

async function expandShortLink(url: URL): Promise<URL> {
  let current = url;

  for (let hop = 0; hop < 3; hop++) {
    if (!SHORT_LINK_HOSTS.has(current.host)) break;

    if (current.protocol === "http:") {
      current = new URL(current.href);
      current.protocol = "https:";
    }

    const response = await fetch(current, {
      redirect: "manual",
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "Futebolada.org/1.0" },
    });
    await response.body?.cancel().catch(() => {});

    const location = response.headers.get("location");
    if (!location) break;

    const next = new URL(location, current);
    if (next.protocol !== "https:") break;
    if (!isAllowedHost(next)) break;

    current = next;
  }

  return current;
}

export async function coordinatesFromGoogleMapsUrl(
  input: string,
): Promise<Coordinates | null> {
  let url: URL;

  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (!isAllowedHost(url)) return null;

  const direct = coordinatesFromUrl(url);
  if (direct) return direct;

  if (!SHORT_LINK_HOSTS.has(url.host)) return null;

  try {
    return coordinatesFromUrl(await expandShortLink(url));
  } catch {
    return null;
  }
}
