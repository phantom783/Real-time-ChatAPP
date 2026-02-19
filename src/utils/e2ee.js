const PRIVATE_KEY_STORAGE_PREFIX = "chatapp-e2ee-private:";
const PUBLIC_KEY_STORAGE_PREFIX = "chatapp-e2ee-public:";
const CURVE_NAME = "P-256";
const AES_ALGORITHM = "AES-GCM";
const E2EE_PAYLOAD_VERSION = 1;
const IV_LENGTH_BYTES = 12;

export const E2EE_DM_PAYLOAD_KIND = "e2e_dm_v1";

function normalizeText(value) {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim();
}

function toBase64(bytes) {
  let binary = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

function fromBase64(base64Value) {
  const binary = atob(String(base64Value || ""));
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function hasWebCrypto() {
  return typeof window !== "undefined" && Boolean(window.crypto?.subtle);
}

function getStorageKeys(userId) {
  const normalizedUserId = normalizeText(userId);
  return {
    privateKey: `${PRIVATE_KEY_STORAGE_PREFIX}${normalizedUserId}`,
    publicKey: `${PUBLIC_KEY_STORAGE_PREFIX}${normalizedUserId}`,
  };
}

async function exportKeyToBase64(key, format) {
  const exportedKey = await window.crypto.subtle.exportKey(format, key);
  return toBase64(new Uint8Array(exportedKey));
}

async function importPrivateKey(privateKeyBase64) {
  return window.crypto.subtle.importKey(
    "pkcs8",
    fromBase64(privateKeyBase64),
    { name: "ECDH", namedCurve: CURVE_NAME },
    false,
    ["deriveBits"],
  );
}

async function importPublicKey(publicKeyBase64) {
  return window.crypto.subtle.importKey(
    "raw",
    fromBase64(publicKeyBase64),
    { name: "ECDH", namedCurve: CURVE_NAME },
    false,
    [],
  );
}

async function isIdentityValid(privateKeyBase64, publicKeyBase64) {
  try {
    await Promise.all([importPrivateKey(privateKeyBase64), importPublicKey(publicKeyBase64)]);
    return true;
  } catch {
    return false;
  }
}

async function deriveAesKey(privateKeyBase64, peerPublicKeyBase64) {
  const privateKey = await importPrivateKey(privateKeyBase64);
  const peerPublicKey = await importPublicKey(peerPublicKeyBase64);
  const sharedBits = await window.crypto.subtle.deriveBits(
    {
      name: "ECDH",
      public: peerPublicKey,
    },
    privateKey,
    256,
  );

  return window.crypto.subtle.importKey(
    "raw",
    sharedBits,
    { name: AES_ALGORITHM },
    false,
    ["encrypt", "decrypt"],
  );
}

function parseE2EEPayload(payloadText) {
  try {
    const parsed = JSON.parse(String(payloadText || ""));
    if (!parsed || parsed.kind !== E2EE_DM_PAYLOAD_KIND) {
      return null;
    }

    const iv = normalizeText(parsed.iv);
    const ciphertext = normalizeText(parsed.ciphertext);
    const senderPublicKey = normalizeText(parsed.senderPublicKey);
    const recipientPublicKey = normalizeText(parsed.recipientPublicKey);
    const version = Number(parsed.version || 0);
    const algorithm = normalizeText(parsed.algorithm || "");

    if (!iv || !ciphertext || !senderPublicKey || !recipientPublicKey) {
      return null;
    }

    if (version !== E2EE_PAYLOAD_VERSION || algorithm !== AES_ALGORITHM) {
      return null;
    }

    return {
      kind: parsed.kind,
      version,
      algorithm,
      iv,
      ciphertext,
      senderPublicKey,
      recipientPublicKey,
    };
  } catch {
    return null;
  }
}

export function isE2EEncryptedPayload(payloadText) {
  return Boolean(parseE2EEPayload(payloadText));
}

export function isWebCryptoSupported() {
  return hasWebCrypto();
}

export async function ensureLocalE2EEIdentity(userId) {
  const normalizedUserId = normalizeText(userId);
  if (!normalizedUserId) {
    throw new Error("Missing user id for E2EE identity setup.");
  }

  if (!hasWebCrypto()) {
    throw new Error("This browser does not support Web Crypto.");
  }

  const storageKeys = getStorageKeys(normalizedUserId);
  let storedPrivateKey = "";
  let storedPublicKey = "";

  try {
    storedPrivateKey = normalizeText(window.localStorage.getItem(storageKeys.privateKey));
    storedPublicKey = normalizeText(window.localStorage.getItem(storageKeys.publicKey));
  } catch {
    // no-op
  }

  if (storedPrivateKey && storedPublicKey) {
    const valid = await isIdentityValid(storedPrivateKey, storedPublicKey);
    if (valid) {
      return {
        privateKey: storedPrivateKey,
        publicKey: storedPublicKey,
      };
    }
  }

  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "ECDH",
      namedCurve: CURVE_NAME,
    },
    true,
    ["deriveBits"],
  );

  const privateKey = await exportKeyToBase64(keyPair.privateKey, "pkcs8");
  const publicKey = await exportKeyToBase64(keyPair.publicKey, "raw");

  try {
    window.localStorage.setItem(storageKeys.privateKey, privateKey);
    window.localStorage.setItem(storageKeys.publicKey, publicKey);
  } catch {
    // no-op
  }

  return { privateKey, publicKey };
}

export async function encryptDirectMessagePayload({
  plainText,
  senderPrivateKeyBase64,
  senderPublicKeyBase64,
  recipientPublicKeyBase64,
}) {
  const normalizedPrivateKey = normalizeText(senderPrivateKeyBase64);
  const normalizedSenderPublicKey = normalizeText(senderPublicKeyBase64);
  const normalizedRecipientPublicKey = normalizeText(recipientPublicKeyBase64);

  if (!normalizedPrivateKey || !normalizedSenderPublicKey || !normalizedRecipientPublicKey) {
    throw new Error("Missing encryption keys for direct-message E2EE.");
  }

  if (!hasWebCrypto()) {
    throw new Error("This browser does not support Web Crypto.");
  }

  const aesKey = await deriveAesKey(normalizedPrivateKey, normalizedRecipientPublicKey);
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES));
  const plaintextBytes = new TextEncoder().encode(String(plainText ?? ""));
  const cipherBuffer = await window.crypto.subtle.encrypt(
    {
      name: AES_ALGORITHM,
      iv,
    },
    aesKey,
    plaintextBytes,
  );

  return JSON.stringify({
    kind: E2EE_DM_PAYLOAD_KIND,
    version: E2EE_PAYLOAD_VERSION,
    algorithm: AES_ALGORITHM,
    iv: toBase64(iv),
    ciphertext: toBase64(new Uint8Array(cipherBuffer)),
    senderPublicKey: normalizedSenderPublicKey,
    recipientPublicKey: normalizedRecipientPublicKey,
  });
}

export async function decryptDirectMessagePayload({
  payloadText,
  currentUserId,
  senderUserId,
  privateKeyBase64,
}) {
  const parsedPayload = parseE2EEPayload(payloadText);
  if (!parsedPayload) {
    throw new Error("Invalid encrypted message payload.");
  }

  const normalizedPrivateKey = normalizeText(privateKeyBase64);
  if (!normalizedPrivateKey) {
    throw new Error("Missing local private key for message decryption.");
  }

  if (!hasWebCrypto()) {
    throw new Error("This browser does not support Web Crypto.");
  }

  const normalizedCurrentUserId = normalizeText(currentUserId);
  const normalizedSenderUserId = normalizeText(senderUserId);
  const peerPublicKey =
    normalizedCurrentUserId && normalizedCurrentUserId === normalizedSenderUserId
      ? parsedPayload.recipientPublicKey
      : parsedPayload.senderPublicKey;

  if (!peerPublicKey) {
    throw new Error("Missing peer key in encrypted payload.");
  }

  const aesKey = await deriveAesKey(normalizedPrivateKey, peerPublicKey);
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: AES_ALGORITHM,
      iv: fromBase64(parsedPayload.iv),
    },
    aesKey,
    fromBase64(parsedPayload.ciphertext),
  );

  return new TextDecoder().decode(decryptedBuffer);
}
