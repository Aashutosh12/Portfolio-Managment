import CryptoJS from 'crypto-js';

/**
 * Hashes a password using SHA-256 for local authentication checking.
 */
export function hashPassword(password: string): string {
  return CryptoJS.SHA256(password).toString();
}

/**
 * Encrypts data using AES-256 with a given master password.
 */
export function encryptData(data: any, password: string): string {
  try {
    const jsonStr = JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonStr, password).toString();
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypts data using AES-256 with a given master password.
 */
export function decryptData(ciphertext: string, password: string): any {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, password);
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
    if (!decryptedText) {
      throw new Error('Incorrect password or corrupted data');
    }
    return JSON.parse(decryptedText);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Decryption failed');
  }
}
