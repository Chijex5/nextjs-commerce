import rawLocations from "@/app/locations_data.json";

export type LocationOption = {
  value: string;
  label: string;
  searchText?: string;
};

type RawLocationState = {
  state: string;
  lgas: Array<{
    lga_name: string;
    wards: string[];
  }>;
};

const NORMALIZE_REGEX = /[^a-z0-9]+/g;

export const normalizeLocationName = (value: string) =>
  value.toLowerCase().replace(NORMALIZE_REGEX, " ").trim();

const formatStateLabel = (state: string) => {
  if (state.toUpperCase() === "FCT") return "FCT";
  return state
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
};

const locationIndex = (rawLocations as RawLocationState[]).map((state) => ({
  stateRaw: state.state,
  stateLabel: formatStateLabel(state.state),
  stateKey: normalizeLocationName(state.state),
  lgas: state.lgas.map((lga) => ({
    name: lga.lga_name,
    key: normalizeLocationName(lga.lga_name),
    wards: lga.wards,
  })),
}));

export const stateOptions: LocationOption[] = locationIndex.map((state) => ({
  value: state.stateLabel,
  label: state.stateLabel,
  searchText: `${state.stateLabel} ${state.stateRaw}`,
}));

const findStateEntry = (value: string) => {
  const key = normalizeLocationName(value);
  return (
    locationIndex.find((state) => state.stateKey === key) ||
    locationIndex.find(
      (state) => normalizeLocationName(state.stateLabel) === key,
    ) ||
    null
  );
};

export const getLgaOptions = (stateValue: string): LocationOption[] => {
  const stateEntry = findStateEntry(stateValue);
  if (!stateEntry) return [];

  return stateEntry.lgas.map((lga) => ({
    value: lga.name,
    label: lga.name,
  }));
};

const findLgaEntry = (stateValue: string, lgaValue: string) => {
  const stateEntry = findStateEntry(stateValue);
  if (!stateEntry) return null;

  const key = normalizeLocationName(lgaValue);
  return (
    stateEntry.lgas.find((lga) => lga.key === key) ||
    stateEntry.lgas.find((lga) => normalizeLocationName(lga.name) === key) ||
    null
  );
};

export const getWardOptions = (
  stateValue: string,
  lgaValue: string,
): LocationOption[] => {
  const lgaEntry = findLgaEntry(stateValue, lgaValue);
  if (!lgaEntry) return [];

  return lgaEntry.wards.map((ward) => ({
    value: ward,
    label: ward,
  }));
};
