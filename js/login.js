import { createInitialState, getState, saveState, importState } from "./storage.js";

const existing = getState();
if (existing?.student?.name) {
  document.querySelector("#studentName").value = existing.student.name;
  document.querySelector("#studentEmail").value = existing.student.email || "";
}

document.querySelector("#loginForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const name = document.querySelector("#studentName").value.trim();
  const email = document.querySelector("#studentEmail").value.trim();
  if (!name) return;
  const state = existing || createInitialState({ name, email });
  state.student.name = name;
  state.student.email = email;
  saveState(state);
  location.href = "app.html";
});

const picker = document.querySelector("#backupFileLogin");
document.querySelector("#importOnLogin").addEventListener("click", () => picker.click());
picker.addEventListener("change", async () => {
  try {
    if (!picker.files[0]) return;
    await importState(picker.files[0]);
    alert("Backup importado com sucesso.");
    location.href = "app.html";
  } catch (error) {
    alert(error.message || "Não foi possível importar o backup.");
  } finally { picker.value = ""; }
});