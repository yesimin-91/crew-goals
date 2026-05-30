import type { CrewUserProfile } from "../repositories/crew-goals-read-repository.js";

export const VIEWER_ID = "mia";

export const USER_PROFILES: Record<string, CrewUserProfile> = {
  mia: {
    id: "mia",
    displayName: "Mia",
    avatarUrl: "/mock/avatars/mia.png"
  },
  nora: {
    id: "nora",
    displayName: "Nora",
    avatarUrl: "/mock/avatars/nora.png"
  },
  isaac: {
    id: "isaac",
    displayName: "Isaac",
    avatarUrl: "/mock/avatars/isaac.png"
  },
  zoe: {
    id: "zoe",
    displayName: "Zoe",
    avatarUrl: "/mock/avatars/zoe.png"
  },
  liam: {
    id: "liam",
    displayName: "Liam",
    avatarUrl: "/mock/avatars/liam.png"
  },
  ava: {
    id: "ava",
    displayName: "Ava",
    avatarUrl: "/mock/avatars/ava.png"
  }
};

export const RECENT_TRAINING_WEEKLY_DISTANCE_KM: Partial<Record<string, number>> = {
  mia: 17.5,
  nora: 14.2,
  isaac: 11.8,
  zoe: 19.4,
  ava: 16.7
};
