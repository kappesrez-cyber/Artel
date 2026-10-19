/** Ракурсы в поиске по фото. Порядок — как предлагаются пустые места под снимки. */
export const photoAngles = [
  { id: "front", label: "Спереди" },
  { id: "side", label: "Сбоку" },
  { id: "angle", label: "Под углом" },
  { id: "marking", label: "Маркировка" },
  { id: "top", label: "Сверху" },
  { id: "other", label: "Другое" },
] as const;

export type PhotoAngle = (typeof photoAngles)[number]["id"];

export const angleLabel = (id: string) => photoAngles.find((a) => a.id === id)?.label ?? "Другое";

export const isPhotoAngle = (value: unknown): value is PhotoAngle =>
  photoAngles.some((a) => a.id === value);

/** Сколько снимков можно приложить к одному поиску. */
export const MAX_SEARCH_PHOTOS = 8;
