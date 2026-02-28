import { ENVList, OptionalEnvironmentVariables } from './environmentVariables';

export function assertEnvDefined(
  vars: ENVList,
  opts?: { allowEmpty?: boolean; label?: string },
): void {
  const allowEmpty = opts?.allowEmpty ?? false;
  const missing = Object.entries(vars)
    .filter(
      ([k, v]) =>
        (!OptionalEnvironmentVariables.has(k) && v === undefined) ||
        (!OptionalEnvironmentVariables.has(k) && !allowEmpty && v === ''),
    )
    .map(([k]) => k);

  if (missing.length > 0) {
    const prefix = opts?.label ? `${opts.label}: ` : '';
    throw new Error(`${prefix}Missing env vars ${missing.join(', ')}`);
  }
}
