export type ExperienceItem = {
  id: string;
  label: string;
  imageUrl: string;
  linkUrl?: string | null;
  type?: string;
  restaurantConfig?: Record<string, unknown>;
};

export type ExperienceSection = {
  id: string;
  slug: string;
  titleFr: string;
  titleEn: string;
  items: ExperienceItem[];
};

export type RoomImage = {
  id: string;
  category: string;
  imageUrl: string;
  sortOrder: number;
  isActive: boolean;
  roomNumber: string | null;
};

export type AgendaEvent = {
  id: string;
  type: string;
  title: string;
  startAt: string;
  endAt: string | null;
  status: string;
  metadata?: Record<string, unknown> | null;
};
