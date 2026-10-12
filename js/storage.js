export const STORAGE_KEY = "uc7_web_academy_state_v1";

export function createInitialState(student = {}) {
  return {
    meta: { schemaVersion: 5, app: "UC7 Web Academy", updatedAt: new Date().toISOString() },
    student: {
      name: student.name || "",
      email: student.email || "",
      className: "2026.36.8",
      uc: "UC7 — Desenvolver aplicações web",
      createdAt: new Date().toISOString()
    },
    journey: { currentPhase: 1, completedMissions: [], unlockedMissions: [], progress: 0 },
    gamification: { xp: 0, level: 1, levelName: "Novato Web", achievements: [], xpHistory: [], rewarded: [] },
    edutech: { progress: 0, repository: "", evidence: [], history: [] },
    guild: { id: null, name: "", members: [], repository: "", tasks: [], evidence: [], history: [], progress: 0 },
    extraMissions: { completed: [], total: 7 },
    checkpoints: {},
    answers: {},
    evidence: [],
    competencies: { I1: [], I2: [], I3: [], I4: [], I5: [], I6: [] },
    pedagogy: { selfNotes: {} },
    preferences: { reducedMotion: false }
  };
}

export function getState() {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : null; }
  catch { return null; }
}

export function saveState(state) {
  state.meta = state.meta || {};
  state.meta.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent("uc7:state-saved",{detail:state}));
  return state;
}

export function clearState() { localStorage.removeItem(STORAGE_KEY); }

export function exportState() {
  const state = getState();
  if (!state) throw new Error("Nenhum dado encontrado.");
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const safeName = (state.student?.name || "aluno").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z0-9]+/g,"-").toLowerCase();
  a.href = url; a.download = `uc7-web-academy-backup-${safeName}.json`; a.click();
  URL.revokeObjectURL(url);
}

export async function importState(file) {
  const text = await file.text();
  const data = JSON.parse(text);
  if (!data || data.meta?.app !== "UC7 Web Academy" || !data.student) throw new Error("Backup inválido ou incompatível.");
  saveState(data);
  return data;
}