// Cifrado/descifrado de credenciales WiFi (solo servidor).
//
// La contraseña de la red se guarda para poder "recordar" la red y
// re-aprovisionar la pulsera de forma automática (auto-reconexión al entrar
// al colegio). Como es una credencial sensible, NUNCA se guarda en claro:
// se cifra con AES-256-GCM antes de persistirla y solo se descifra en el
// endpoint de aprovisionamiento (service_role), nunca en el navegador.
//
// La clave se deriva de WIFI_ENCRYPTION_KEY (recomendado) o, como respaldo
// para desarrollo, de SUPABASE_SERVICE_ROLE_KEY. Configura WIFI_ENCRYPTION_KEY
// en producción (cualquier cadena larga y secreta).

import crypto from "crypto";

const VERSION = "v1";

function getKey() {
  const secret =
    process.env.WIFI_ENCRYPTION_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "calmband-dev-key";
  // Derivamos 32 bytes determinísticos a partir del secreto.
  return crypto.createHash("sha256").update(String(secret)).digest();
}

// Devuelve un string "v1:<iv>:<tag>:<ciphertext>" (todo en hex) o null.
export function encryptWifiPassword(plain) {
  if (!plain) return null;
  const key = getKey();
  const iv = crypto.randomBytes(12); // GCM: nonce de 96 bits
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(String(plain), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    VERSION,
    iv.toString("hex"),
    tag.toString("hex"),
    ciphertext.toString("hex"),
  ].join(":");
}

// Recibe el string cifrado y devuelve la contraseña en claro (o null si falla).
export function decryptWifiPassword(stored) {
  if (!stored || typeof stored !== "string") return null;
  const parts = stored.split(":");
  if (parts.length !== 4 || parts[0] !== VERSION) return null;
  try {
    const [, ivHex, tagHex, dataHex] = parts;
    const key = getKey();
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(ivHex, "hex")
    );
    decipher.setAuthTag(Buffer.from(tagHex, "hex"));
    const plain = Buffer.concat([
      decipher.update(Buffer.from(dataHex, "hex")),
      decipher.final(),
    ]);
    return plain.toString("utf8");
  } catch (err) {
    console.error("[wifiCrypto] no se pudo descifrar la contraseña WiFi:", err.message);
    return null;
  }
}
