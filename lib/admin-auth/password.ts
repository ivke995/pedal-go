import { pbkdf2Sync, timingSafeEqual } from "node:crypto";

const SUPPORTED_PASSWORD_ALGORITHM = "pbkdf2_sha256";

export function verifyAdminPassword(password: string, storedPasswordHash: string): boolean {
  const [algorithm, iterationsValue, salt, expectedHash] = storedPasswordHash.split("$");

  if (algorithm !== SUPPORTED_PASSWORD_ALGORITHM || !iterationsValue || !salt || !expectedHash) {
    return false;
  }

  const iterations = Number(iterationsValue);

  if (!Number.isInteger(iterations) || iterations <= 0) {
    return false;
  }

  const candidateHash = pbkdf2Sync(password, salt, iterations, 32, "sha256").toString("base64url");
  const candidateBuffer = Buffer.from(candidateHash);
  const expectedBuffer = Buffer.from(expectedHash);

  return candidateBuffer.length === expectedBuffer.length && timingSafeEqual(candidateBuffer, expectedBuffer);
}
