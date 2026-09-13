// Pure functions shared by the browser (js/app.js) and the gate runner
// (scripts/gates.mjs). No DOM/Node APIs here so both can import it as-is.

const ADDRESS_SHAPE = /^0x[0-9a-fA-F]{40}$/;

/**
 * Decide whether a candidate string is the registry's stated contract
 * address. Never blanket-accepts anything that merely looks like an
 * address — it must match the registry's stated value exactly.
 */
export function resolveContractAddress(candidate, registry) {
  const stated = registry?.contractAddress?.status === "stated"
    ? registry.contractAddress.value
    : null;
  if (!stated) return { ok: false, reason: "absent" };
  if (typeof candidate !== "string" || !ADDRESS_SHAPE.test(candidate)) {
    return { ok: false, reason: "not-address-shaped" };
  }
  if (candidate.toLowerCase() !== stated.toLowerCase()) {
    return { ok: false, reason: "mismatch" };
  }
  return { ok: true, value: stated };
}

export function resolveSocial(key, registry) {
  const record = registry?.socials?.[key];
  if (!record) return { ok: false, reason: "unknown-key" };
  if (record.status !== "verified" || !record.url) {
    return { ok: false, reason: record.status ?? "absent" };
  }
  return { ok: true, url: record.url };
}

export function isAddressShaped(str) {
  return typeof str === "string" && ADDRESS_SHAPE.test(str);
}
