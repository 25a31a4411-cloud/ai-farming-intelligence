import { initialFarmingData } from "./farmingData";
export { createId } from "./ids.js";

const STORAGE_KEY = "ai-farming-intelligence-prototype-v1";

export function createInitialPrototypeData() {
  return {
    crops: [],
    offers: [],
    orders: [],
    buyers: initialFarmingData.buyers.map((buyer) => ({
      ...buyer,
      demo: true,
    })),
  };
}

export function loadPrototype() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");
    const user = saved?.user
      ? { name: saved.user.name, role: saved.user.role, language: saved.user.language }
      : null;
    return {
      data: saved?.data || createInitialPrototypeData(),
      user,
      language: saved?.language || "en",
    };
  } catch {
    return {
      data: createInitialPrototypeData(),
      user: null,
      language: "en",
    };
  }
}

export function savePrototype(prototype) {
  try {
    const user = prototype.user
      ? { name: prototype.user.name, role: prototype.user.role, language: prototype.user.language }
      : null;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prototype, user }));
    return true;
  } catch {
    return false;
  }
}
