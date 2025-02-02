// verifyNostrSig.js
import { schnorr } from '@noble/curves/secp256k1';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';
import { ValidationError, InvalidSignatureError } from './errors.js';

const relays = [
    'wss://relay.damus.io',
    'wss://relay.nostr.band',
    'wss://nos.lol'
];

async function verifySignature(event) {
  try {
    if (!event || !event.pubkey || !event.sig || !event.created_at || !event.kind || !event.tags || !event.content) {
      throw new ValidationError('Missing required Nostr event fields');
    }

    // Debug input
    console.log('\nVerifying Nostr event:', JSON.stringify(event, null, 2));

    // 1. Serialize the event
    const serializedEvent = new TextEncoder().encode(
      JSON.stringify([
        0,
        event.pubkey,
        event.created_at,
        event.kind,
        event.tags,
        event.content
      ])
    );

    // 2. Calculate the event hash
    const eventHash = sha256(serializedEvent);
    const calculatedId = bytesToHex(eventHash);

    // console.log('\nVerification details:');
    // console.log('1. Calculated event ID:', calculatedId);
    // console.log('2. Provided event ID:', event.id);
    
    // 3. Verify the event ID matches
    if (calculatedId !== event.id) {
      throw new InvalidSignatureError('Event ID mismatch');
    }

    // 4. Convert hex strings to Uint8Arrays
    const signature = hexToBytes(event.sig);
    const pubkey = hexToBytes(event.pubkey);

    // 5. Verify using schnorr
    const isValid = schnorr.verify(
      signature,
      eventHash,
      pubkey
    );

    console.log('3. Signature verification result:', isValid);
    
    if (!isValid) {
      throw new InvalidSignatureError('Invalid Schnorr signature');
    }

    return true;

  } catch (error) {
    // If it's already one of our custom errors, rethrow it
    if (error.statusCode) {
      throw error;
    }
    // Otherwise wrap it in a ValidationError
    console.error('\nVerification error:', error);
    throw new ValidationError(`Signature verification failed: ${error.message}`);
  }
}

function hexToBytes(hex) {
  try {
    if (typeof hex !== 'string') {
      throw new ValidationError('Expected hex string, got ' + typeof hex);
    }
    
    hex = hex.replace('0x', '');
    
    if (hex.length % 2 !== 0) {
      hex = '0' + hex;
    }
    
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      const j = i * 2;
      bytes[i] = parseInt(hex.slice(j, j + 2), 16);
    }
    return bytes;
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }
    throw new ValidationError(`Invalid hex string: ${error.message}`);
  }
};

async function getPublicKey() {
    try {
        const pubKey = await window.nostr.getPublicKey();
        return pubKey
    } catch (error) {
        if (error.statusCode) {
          throw error;
        }
        throw new ValidationError(`Invalid public key: ${error.message}`);
      }
    
  }

async function fetchNostrProfile(pubKey) {
    for (const relayUrl of relays) {
        try {
            const profile = await fetchProfileFromRelay(relayUrl, pubKey);
            return profile
        } catch (error) {
            console.error(`Failed to fetch from ${relayUrl}:`, error);
        }
    }
}

const fetchProfileFromRelay = (relayUrl, pubKey) => {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(relayUrl);
        const timeout = setTimeout(() => {
            ws.close();
            resolve(null);
        }, 5000);

        ws.onopen = () => {
            ws.send(JSON.stringify([
                "REQ",
                "profile-req",
                { kinds: [0], authors: [pubKey], limit: 1 }
            ]));
        };

        ws.onmessage = (msg) => {
            try {
                const [type, _, event] = JSON.parse(msg.data);
                if (type === 'EVENT' && event?.kind === 0) {
                    const profile = JSON.parse(event.content);
                    clearTimeout(timeout);
                    ws.close();
                    resolve(profile);
                } else if (type === 'EOSE') {
                    clearTimeout(timeout);
                    ws.close();
                    resolve(null);
                }
            } catch (error) {
                console.error('Error parsing message:', error);
            }
        };

        ws.onerror = () => {
            clearTimeout(timeout);
            ws.close();
            resolve(null);
        };
    });
};


export { 
    verifySignature, 
    getPublicKey,
    fetchNostrProfile,
};