const TEACHER_MODE_KEY = "quagbot:teacher-mode";
const TEACHER_MODE_CHANGE_EVENT = "quagbot:teacher-mode-change";

export function setTeacherMode(enabled) {
  if (typeof window === "undefined") return;

  if (enabled) {
    window.sessionStorage.setItem(TEACHER_MODE_KEY, "true");
  } else {
    window.sessionStorage.removeItem(TEACHER_MODE_KEY);
  }
  window.dispatchEvent(new Event(TEACHER_MODE_CHANGE_EVENT));
}

export function isTeacherMode() {
  return (
    typeof window !== "undefined" &&
    window.sessionStorage.getItem(TEACHER_MODE_KEY) === "true"
  );
}

export function subscribeToTeacherMode(callback) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener(TEACHER_MODE_CHANGE_EVENT, callback);
  return () => window.removeEventListener(TEACHER_MODE_CHANGE_EVENT, callback);
}
