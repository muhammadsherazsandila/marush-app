import { Platform } from 'react-native';
import * as ExpoCrypto from 'expo-crypto';
import 'fast-text-encoding';

/**
 * Supabase Auth JS relies on WebCrypto for S256 PKCE. Expo Go has native
 * cryptographic primitives through expo-crypto, but does not expose the full
 * WebCrypto surface globally, so bridge only the missing APIs on native.
 */
if (Platform.OS !== 'web') {
  const nativeGlobal = globalThis as typeof globalThis & {
    crypto?: Crypto;
    TextEncoder?: typeof TextEncoder;
  };

  const cryptoObject = (nativeGlobal.crypto || {}) as Crypto & {
    subtle?: SubtleCrypto;
  };

  if (typeof cryptoObject.getRandomValues !== 'function') {
    Object.defineProperty(cryptoObject, 'getRandomValues', {
      configurable: true,
      value: ExpoCrypto.getRandomValues,
    });
  }

  const subtle = (cryptoObject.subtle || {}) as SubtleCrypto;
  if (typeof subtle.digest !== 'function') {
    Object.defineProperty(subtle, 'digest', {
      configurable: true,
      value: (algorithm: AlgorithmIdentifier, data: BufferSource) => {
        const name = typeof algorithm === 'string' ? algorithm : algorithm.name;
        if (name.toUpperCase().replace('-', '') !== 'SHA256') {
          throw new Error(`Unsupported native WebCrypto digest algorithm: ${name}`);
        }
        return ExpoCrypto.digest(ExpoCrypto.CryptoDigestAlgorithm.SHA256, data);
      },
    });
  }

  if (!cryptoObject.subtle) {
    Object.defineProperty(cryptoObject, 'subtle', {
      configurable: true,
      value: subtle,
    });
  }

  if (!nativeGlobal.crypto) {
    Object.defineProperty(nativeGlobal, 'crypto', {
      configurable: true,
      value: cryptoObject,
    });
  }

  if (
    typeof nativeGlobal.TextEncoder !== 'function' ||
    typeof cryptoObject.getRandomValues !== 'function' ||
    typeof cryptoObject.subtle?.digest !== 'function'
  ) {
    throw new Error('Secure PKCE crypto is unavailable in this native runtime.');
  }
}
