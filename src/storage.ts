import type { Invitation, Profile } from "./types";

export const KEYS = {
  profile: "skillswap:v1:myProfile",
  invitations: "skillswap:v1:invitations",
  favorites: "skillswap:v1:favorites",
};

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function isSkillId(value: unknown): boolean {
  return (
    value === "photography" ||
    value === "guitar" ||
    value === "python" ||
    value === "excel" ||
    value === "english" ||
    value === "presentation"
  );
}

function isProfile(value: unknown): value is Profile {
  if (!value || typeof value !== "object") return false;
  const p = value as Profile;
  return (
    typeof p.id === "string" &&
    typeof p.nickname === "string" &&
    typeof p.bio === "string" &&
    isSkillId(p.teachSkillId) &&
    isSkillId(p.learnSkillId) &&
    typeof p.teachDescription === "string" &&
    typeof p.learnGoal === "string"
  );
}

function isInvitation(value: unknown): value is Invitation {
  if (!value || typeof value !== "object") return false;
  const i = value as Invitation;
  return (
    typeof i.id === "string" &&
    typeof i.targetUserId === "string" &&
    typeof i.targetNickname === "string" &&
    isSkillId(i.myTeachSkillId) &&
    isSkillId(i.partnerTeachSkillId) &&
    typeof i.myTeachDescription === "string" &&
    typeof i.partnerTeachDescription === "string" &&
    typeof i.message === "string" &&
    (i.status === "pending" || i.status === "withdrawn") &&
    typeof i.createdAt === "string"
  );
}

export function loadProfile(): Profile | null {
  try {
    const data = safeParse<unknown>(localStorage.getItem(KEYS.profile), null);
    return isProfile(data) ? data : null;
  } catch {
    return null;
  }
}

export function loadInvitations(): Invitation[] {
  try {
    const data = safeParse<unknown>(localStorage.getItem(KEYS.invitations), []);
    return Array.isArray(data) ? data.filter(isInvitation) : [];
  } catch {
    return [];
  }
}

export function loadFavorites(): string[] {
  try {
    const data = safeParse<unknown>(localStorage.getItem(KEYS.favorites), []);
    return Array.isArray(data) ? data.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function saveJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    throw new Error("当前浏览器无法保存数据，请检查是否关闭了本地存储。");
  }
}
