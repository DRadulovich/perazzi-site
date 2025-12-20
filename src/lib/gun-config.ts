import rawConfig from "../../V2-PGPT/V2_PreBuild-Docs/V2_Gun-Info-Docs/gun_order_flow.json";

export type FieldOption = {
  value: string;
  constraints: Record<string, string[]>;
};

export type FieldDefinition = {
  id: string;
  section: string;
  dependsOn: string[];
  options: FieldOption[];
};

export type GunOrderConfig = {
  fields: FieldDefinition[];
};

export type BuildState = Record<string, string>;

const gunOrderConfig = rawConfig as GunOrderConfig;

function dependenciesSatisfied(field: FieldDefinition, state: BuildState) {
  return field.dependsOn.every((dep) => state[dep] !== undefined);
}

function optionMatchesState(option: FieldOption, state: BuildState) {
  return Object.entries(option.constraints ?? {}).every(([depField, allowedValues]) => {
    const current = state[depField];
    if (!current) return false;
    return allowedValues.includes(current);
  });
}

export function getField(id: string): FieldDefinition | undefined {
  return gunOrderConfig.fields.find((field) => field.id === id);
}

export function getFieldOrder(): string[] {
  return gunOrderConfig.fields.map((field) => field.id);
}

export function getNextField(state: BuildState): FieldDefinition | undefined {
  const skipEngravingIfGrade = new Set(["STANDARD", "LUSSO", "SC2"]);
  for (const field of gunOrderConfig.fields) {
    if (state[field.id]) continue;
    if (field.id === "ENGRAVING" && skipEngravingIfGrade.has(state.GRADE ?? "")) {
      continue;
    }
    if (!dependenciesSatisfied(field, state)) continue;
    const valid = getValidOptions(field.id, state);
    if (field.options.length > 0 && valid.length === 0) {
      // Skip fields that have constrained options but none are valid for the current state.
      continue;
    }
    return field;
  }
  return undefined;
}

export function getValidOptions(fieldId: string, state: BuildState): FieldOption[] {
  const field = getField(fieldId);
  if (!field) return [];
  return field.options.filter((opt) => Object.keys(opt.constraints || {}).length === 0 || optionMatchesState(opt, state));
}

export function validateSelection(fieldId: string, value: string, state: BuildState): { valid: boolean; reason?: string } {
  const options = getValidOptions(fieldId, state);
  const match = options.find((opt) => opt.value === value);
  if (!match) {
    const allowed = options.map((opt) => opt.value);
    return {
      valid: false,
      reason: allowed.length ? `Valid options: ${allowed.join(", ")}` : "No valid options based on current selections.",
    };
  }
  return { valid: true };
}

export function summarizeSelections(state: BuildState): string {
  const entries = gunOrderConfig.fields
    .filter((field) => state[field.id])
    .map((field) => `${field.id}: ${state[field.id]}`);
  return entries.join("; ");
}

export { gunOrderConfig };
