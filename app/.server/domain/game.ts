
export interface Location {
  amenity?: string;
  road?: string;
  neighbourhood?: string;
  city_district?: string;
  town?: string;
  county?: string;
  ISO3166_2_lvl6?: string;
  postcode?: string;
  country?: string;
  country_code?: string;
}
export async function getLocationName(latitude: number, longitude: number): Promise<Location | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Futebolada.org/1.0",
    },
  });
  const data = await response.json();

  if (data && data.address) {
    return data.address;
  }

  return null;
}