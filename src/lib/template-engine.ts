/**
 * Template engine — takes HTML with {{mustache}} tags and config → populated HTML.
 *
 * Supported syntax:
 *   {{variable}}         — simple variable replacement
 *   {{#section}}...{{/section}} — conditional block (shown only if section.enabled)
 *   {{#validUntil}}...{{/validUntil}} — shown if validUntil exists
 *   {{#perRoleRows}}...{{/perRoleRows}} — loop over per-role entries
 *   {{#flatRateRows}}...{{/flatRateRows}} — loop over flat-rate entries
 */

interface RoleEntry {
  label: string;
  offshore: number[];
  onshore: number[];
}

interface FlatRoleEntry {
  label: string;
  offshore: number;
  onshore: number;
}

interface RateConfig {
  sections: {
    blended: {
      enabled: boolean;
      rates: { offshore: number[]; onshore: number[] };
    };
    perRole: {
      enabled: boolean;
      roles: RoleEntry[];
    };
    flatRate: {
      enabled: boolean;
      roles: FlatRoleEntry[];
    };
    billingTerms: {
      enabled: boolean;
      netPayment: number;
      lateFee: number;
    };
  };
}

interface RenderContext {
  clientName: string;
  validUntil?: string;
  logoBase64?: string;
  year: number;
  config: RateConfig;
}

export function renderTemplate(html: string, ctx: RenderContext): string {
  let result = html;

  // Simple variable replacements first
  result = result.replace(/\{\{clientName\}\}/g, escapeHtml(ctx.clientName));
  result = result.replace(/\{\{year\}\}/g, String(ctx.year));
  result = result.replace(/\{\{logoBase64\}\}/g, ctx.logoBase64 ?? "");

  // validUntil conditional
  result = processConditional(result, "validUntil", !!ctx.validUntil, () => {
    let r = result;
    r = r.replace(/\{\{validUntil\}\}/g, escapeHtml(ctx.validUntil ?? ""));
    return r;
  });

  // Blended section
  const blend = ctx.config.sections.blended;
  result = processConditional(result, "blendedEnabled", blend.enabled, () => {
    let r = result;
    const rates = blend.rates;
    r = r.replace(/\{\{blendedOffshore0to6\}\}/g, fmt(rates.offshore[0]));
    r = r.replace(/\{\{blendedOffshore6to12\}\}/g, fmt(rates.offshore[1]));
    r = r.replace(/\{\{blendedOffshore12plus\}\}/g, fmt(rates.offshore[2]));
    r = r.replace(/\{\{blendedOnshore0to6\}\}/g, fmt(rates.onshore[0]));
    r = r.replace(/\{\{blendedOnshore6to12\}\}/g, fmt(rates.onshore[1]));
    r = r.replace(/\{\{blendedOnshore12plus\}\}/g, fmt(rates.onshore[2]));
    return r;
  });

  // Per-role section
  const perRole = ctx.config.sections.perRole;
  result = processConditional(result, "perRoleEnabled", perRole.enabled, () => {
    let r = result;
    r = processLoop(r, "perRoleRows", perRole.roles, (role, block) => {
      return block
        .replace(/\{\{label\}\}/g, escapeHtml(role.label))
        .replace(/\{\{off0to6\}\}/g, fmt(role.offshore[0]))
        .replace(/\{\{off6to12\}\}/g, fmt(role.offshore[1]))
        .replace(/\{\{off12plus\}\}/g, fmt(role.offshore[2]))
        .replace(/\{\{on0to6\}\}/g, fmt(role.onshore[0]))
        .replace(/\{\{on6to12\}\}/g, fmt(role.onshore[1]))
        .replace(/\{\{on12plus\}\}/g, fmt(role.onshore[2]));
    });
    return r;
  });

  // Flat-rate section
  const flat = ctx.config.sections.flatRate;
  result = processConditional(result, "flatRateEnabled", flat.enabled, () => {
    let r = result;
    r = processLoop(r, "flatRateRows", flat.roles, (role, block) => {
      return block
        .replace(/\{\{label\}\}/g, escapeHtml(role.label))
        .replace(/\{\{offshore\}\}/g, fmt(role.offshore))
        .replace(/\{\{onshore\}\}/g, fmt(role.onshore));
    });
    return r;
  });

  // Billing terms
  const billing = ctx.config.sections.billingTerms;
  result = processConditional(result, "billingEnabled", billing.enabled, () => {
    let r = result;
    r = r.replace(/\{\{netPayment\}\}/g, String(billing.netPayment));
    r = r.replace(/\{\{lateFee\}\}/g, String(billing.lateFee));
    return r;
  });

  return result;
}

/** Process {{#blockName}}...{{/blockName}} conditional */
function processConditional(
  html: string,
  blockName: string,
  show: boolean,
  replaceFn: () => string
): string {
  const re = new RegExp(
    `\\{\\{#${escapeRegExp(blockName)}\\}\\}([\\s\\S]*?)\\{\\{/${escapeRegExp(blockName)}\\}\\}`,
    "g"
  );

  // First pass: extract blocks, process them, then remove remaining tags
  let result = html;
  if (show) {
    result = result.replace(re, (_, inner: string) => inner);
  } else {
    result = result.replace(re, "");
  }
  // Remove any leftover standalone {{#name}} {{/name}} tags
  const openRe = new RegExp(`\\{\\{#${escapeRegExp(blockName)}\\}\\}`, "g");
  const closeRe = new RegExp(`\\{\\{/${escapeRegExp(blockName)}\\}\\}`, "g");
  result = result.replace(openRe, "").replace(closeRe, "");

  // Apply custom replacements within the block's scope
  if (show) result = replaceFn();
  return result;
}

/** Process {{#loopName}}...{{/loopName}} loop */
function processLoop<T>(
  html: string,
  loopName: string,
  items: T[],
  rowFn: (item: T, block: string) => string
): string {
  const re = new RegExp(
    `\\{\\{#${escapeRegExp(loopName)}\\}\\}([\\s\\S]*?)\\{\\{/${escapeRegExp(loopName)}\\}\\}`,
    "g"
  );

  return html.replace(re, (_, block: string) => {
    return items.map((item) => rowFn(item, block)).join("\n");
  });
}

function fmt(n: number): string {
  return n.toFixed(2);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
