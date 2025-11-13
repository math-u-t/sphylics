/**
 * bbauth Cryptography
 * ES256, Ed25519, PKCE実装
 */

import { JWTPayload, JWK } from './types';

// Base64URL encoding/decoding
export function base64urlEncode(data: ArrayBuffer | Uint8Array): string {
  const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export function base64urlDecode(str: string): Uint8Array {
  // Pad with '=' to make length multiple of 4
  const padding = '='.repeat((4 - (str.length % 4)) % 4);
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/') + padding;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Generate random token
export function generateRandomToken(length: number = 32): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return base64urlEncode(bytes);
}

// PKCE verification
export async function verifyPKCE(
  codeVerifier: string,
  codeChallenge: string,
  method: 'S256'
): Promise<boolean> {
  if (method !== 'S256') {
    return false;
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const computed = base64urlEncode(hash);

  return computed === codeChallenge;
}

// ES256 Key Pair Generation
export async function generateES256KeyPair(): Promise<{
  privateKey: CryptoKey;
  publicKey: CryptoKey;
}> {
  return await crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true,
    ['sign', 'verify']
  );
}

// Export keys to PEM format
export async function exportPrivateKeyToPEM(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('pkcs8', key);
  const base64 = btoa(String.fromCharCode(...new Uint8Array(exported)));
  return `-----BEGIN PRIVATE KEY-----\n${base64.match(/.{1,64}/g)?.join('\n')}\n-----END PRIVATE KEY-----`;
}

export async function exportPublicKeyToPEM(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('spki', key);
  const base64 = btoa(String.fromCharCode(...new Uint8Array(exported)));
  return `-----BEGIN PUBLIC KEY-----\n${base64.match(/.{1,64}/g)?.join('\n')}\n-----END PUBLIC KEY-----`;
}

// Import keys from PEM format
export async function importPrivateKeyFromPEM(pem: string): Promise<CryptoKey> {
  const base64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return await crypto.subtle.importKey(
    'pkcs8',
    bytes,
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true,
    ['sign']
  );
}

export async function importPublicKeyFromPEM(pem: string): Promise<CryptoKey> {
  const base64 = pem
    .replace(/-----BEGIN PUBLIC KEY-----/, '')
    .replace(/-----END PUBLIC KEY-----/, '')
    .replace(/\s/g, '');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return await crypto.subtle.importKey(
    'spki',
    bytes,
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true,
    ['verify']
  );
}

// JWT signing and verification
export async function signJWT(
  payload: JWTPayload,
  privateKeyPEM: string
): Promise<string> {
  const header = {
    alg: 'ES256',
    typ: 'JWT',
  };

  const encodedHeader = base64urlEncode(
    new TextEncoder().encode(JSON.stringify(header))
  );
  const encodedPayload = base64urlEncode(
    new TextEncoder().encode(JSON.stringify(payload))
  );
  const message = `${encodedHeader}.${encodedPayload}`;

  const privateKey = await importPrivateKeyFromPEM(privateKeyPEM);
  const signature = await crypto.subtle.sign(
    {
      name: 'ECDSA',
      hash: 'SHA-256',
    },
    privateKey,
    new TextEncoder().encode(message)
  );

  return `${message}.${base64urlEncode(signature)}`;
}

export async function verifyJWT(
  token: string,
  publicKeyPEM: string
): Promise<JWTPayload | null> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const message = `${encodedHeader}.${encodedPayload}`;

  try {
    const publicKey = await importPublicKeyFromPEM(publicKeyPEM);
    const signature = base64urlDecode(encodedSignature);

    const isValid = await crypto.subtle.verify(
      {
        name: 'ECDSA',
        hash: 'SHA-256',
      },
      publicKey,
      signature,
      new TextEncoder().encode(message)
    );

    if (!isValid) {
      return null;
    }

    const payload = JSON.parse(
      new TextDecoder().decode(base64urlDecode(encodedPayload))
    );

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch (e) {
    return null;
  }
}

// Extract JWK from public key
export async function publicKeyToJWK(publicKeyPEM: string): Promise<JWK> {
  const publicKey = await importPublicKeyFromPEM(publicKeyPEM);
  const exported = await crypto.subtle.exportKey('jwk', publicKey);

  return {
    kty: 'EC',
    use: 'sig',
    kid: 'default',
    alg: 'ES256',
    crv: exported.crv!,
    x: exported.x!,
    y: exported.y!,
  };
}

// Ed25519 operations (for Provider ID)
// Note: Web Crypto API doesn't support Ed25519 yet, so we'll use a placeholder
// In production, you'd use a library like @noble/ed25519
export async function generateEd25519KeyPair(): Promise<{
  privateKey: Uint8Array;
  publicKey: Uint8Array;
}> {
  // Placeholder: generate random keys
  // In production, use proper Ed25519 library
  const privateKey = new Uint8Array(32);
  const publicKey = new Uint8Array(32);
  crypto.getRandomValues(privateKey);
  crypto.getRandomValues(publicKey);
  return { privateKey, publicKey };
}

export function ed25519PublicKeyToProviderId(publicKey: Uint8Array): string {
  return `bbauth:${base64urlEncode(publicKey)}`;
}
