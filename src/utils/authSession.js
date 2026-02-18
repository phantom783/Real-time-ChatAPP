const AUTH_SESSION_STORAGE_KEY = "chatapp-auth-session";
const AUTH_LEGACY_KEYS = {
  userId: "userId",
  username: "username",
  token: "token",
};

function normalizeText(value) {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim();
}

function normalizeSession(raw) {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const userId = normalizeText(raw.userId);
  const token = normalizeText(raw.token);
  const username = normalizeText(raw.username);

  if (!userId || !token) {
    return null;
  }

  return { userId, username, token };
}

function readStructuredSession(storage) {
  try {
    const rawValue = storage.getItem(AUTH_SESSION_STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    return normalizeSession(JSON.parse(rawValue));
  } catch {
    return null;
  }
}

function readLegacySession(storage) {
  try {
    const userId = normalizeText(storage.getItem(AUTH_LEGACY_KEYS.userId));
    const token = normalizeText(storage.getItem(AUTH_LEGACY_KEYS.token));
    const username = normalizeText(storage.getItem(AUTH_LEGACY_KEYS.username));

    if (!userId || !token) {
      return null;
    }

    return { userId, username, token };
  } catch {
    return null;
  }
}

function writeSession(storage, session) {
  storage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
  storage.setItem(AUTH_LEGACY_KEYS.userId, session.userId);
  storage.setItem(AUTH_LEGACY_KEYS.username, session.username || "");
  storage.setItem(AUTH_LEGACY_KEYS.token, session.token);
}

function clearSessionStorage(storage) {
  storage.removeItem(AUTH_SESSION_STORAGE_KEY);
  storage.removeItem(AUTH_LEGACY_KEYS.userId);
  storage.removeItem(AUTH_LEGACY_KEYS.username);
  storage.removeItem(AUTH_LEGACY_KEYS.token);
}

function emptySession() {
  return { userId: "", username: "", token: "" };
}

export function getAuthSession() {
  if (typeof window === "undefined") {
    return emptySession();
  }

  const sessionStorageSession =
    readStructuredSession(window.sessionStorage) || readLegacySession(window.sessionStorage);
  if (sessionStorageSession) {
    return sessionStorageSession;
  }

  const localStorageSession =
    readStructuredSession(window.localStorage) || readLegacySession(window.localStorage);
  if (!localStorageSession) {
    return emptySession();
  }

  try {
    writeSession(window.sessionStorage, localStorageSession);
  } catch {
    // no-op
  }

  return localStorageSession;
}

export function hasAuthSession() {
  const session = getAuthSession();
  return Boolean(session.userId && session.token);
}

export function saveAuthSession(sessionCandidate) {
  if (typeof window === "undefined") {
    return false;
  }

  const session = normalizeSession(sessionCandidate);
  if (!session) {
    return false;
  }

  try {
    writeSession(window.sessionStorage, session);
    writeSession(window.localStorage, session);
    return true;
  } catch {
    return false;
  }
}

export function clearAuthSession() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    clearSessionStorage(window.sessionStorage);
    clearSessionStorage(window.localStorage);
  } catch {
    // no-op
  }
}
