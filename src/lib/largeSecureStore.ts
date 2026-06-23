import "react-native-get-random-values";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as aesjs from "aes-js";

// expo-secure-store caps values at ~2048 bytes on Android, which a Supabase
// session (access + refresh JWT) regularly exceeds. Standard workaround
// (per Supabase's Expo guide): keep the bulky session blob in AsyncStorage,
// encrypted with a per-key AES-256 key that itself lives in SecureStore.
export class LargeSecureStore {
  private async getEncryptionKey(key: string): Promise<Uint8Array> {
    const existing = await SecureStore.getItemAsync(key);
    if (existing) return aesjs.utils.hex.toBytes(existing);

    const keyHex = aesjs.utils.hex.fromBytes(crypto.getRandomValues(new Uint8Array(32)));
    await SecureStore.setItemAsync(key, keyHex);
    return aesjs.utils.hex.toBytes(keyHex);
  }

  async getItem(key: string): Promise<string | null> {
    const encrypted = await AsyncStorage.getItem(key);
    if (!encrypted) return null;

    const encryptionKey = await this.getEncryptionKey(`${key}_key`);
    const cipher = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(1));
    const decryptedBytes = cipher.decrypt(aesjs.utils.hex.toBytes(encrypted));
    return aesjs.utils.utf8.fromBytes(decryptedBytes);
  }

  async setItem(key: string, value: string): Promise<void> {
    const encryptionKey = await this.getEncryptionKey(`${key}_key`);
    const cipher = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(1));
    const encryptedBytes = cipher.encrypt(aesjs.utils.utf8.toBytes(value));
    await AsyncStorage.setItem(key, aesjs.utils.hex.fromBytes(encryptedBytes));
  }

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
    await SecureStore.deleteItemAsync(`${key}_key`);
  }
}
