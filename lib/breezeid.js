// Addapted from https://github.com/tzwel/BreezeID to be used in the browser
import { profanities } from "./profanities.js";

const charset = "AEIUQWTYPSDFGRHJKLZXCVBNM2346789";

const poolSize = 16 * 8; // default id length * 8 = 128
let pool;
let poolIndex = 0;

fillPool();
function fillPool() {
  // Generate random bytes using the Web Crypto API
  pool = new Uint8Array(poolSize);
  window.crypto.getRandomValues(pool);
}

function hasProfanity(input) {
  return profanities.some(function (v) {
    return input.toLowerCase().indexOf(v) >= 0;
  });
}

function breezeid(length = 4 * 4) {
  if (length > poolSize) {
    throw new Error(
      `breezeid: Max ID length (${poolSize}) exceeded. Increase the pool size in source.`
    );
  }

  return insertHyphens(genChars(length));
}

function genChars(length) {
  let result = "";

  // If the amount to generate exceeds the pool size, refill the pool
  if (poolIndex + length >= pool.length) {
    fillPool();
    poolIndex = 0;
  }

  for (let i = 0; i < length; i++) {
    result += charset[pool[poolIndex] % charset.length];
    poolIndex++;
  }
  return result;
}

function insertHyphens(input, every = 4, joinBy = "-") {
  let result = [];
  let position = 0;
  for (let index = 0; index < input.length / every; index++) {
    let fragment = input.slice(position, position + every);
    if (hasProfanity(fragment)) {
      fragment = genChars(fragment.length);
      if (hasProfanity(fragment)) {
        fragment = fragment.split("").reverse().join("");
      }
    }

    result.push(fragment);

    position += every;
  }
  return result.join(joinBy);
}

export { breezeid };
