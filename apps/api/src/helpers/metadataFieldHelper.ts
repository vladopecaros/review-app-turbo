import { Schema } from 'mongoose';

const DEFAULT_METADATA_MAX_BYTES = 256 * 1024;

type MetadataObject = Record<string, unknown>;

const isPlainObject = (value: unknown): value is MetadataObject => {
  if (value === null || typeof value !== 'object') return false;
  if (Array.isArray(value)) return false;

  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

const getJsonByteLength = (value: unknown): number => {
  if (value === undefined) return 0;

  let json: string | undefined;
  try {
    json = JSON.stringify(value);
  } catch {
    return Number.MAX_SAFE_INTEGER;
  }

  if (json === undefined) return 0;
  return Buffer.byteLength(json, 'utf8');
};

export const createMetadataField = (options?: { maxBytes?: number }) => {
  const maxBytes = options?.maxBytes ?? DEFAULT_METADATA_MAX_BYTES;

  return {
    type: Schema.Types.Mixed,
    default: {},
    validate: [
      {
        validator: (value: unknown) =>
          value === undefined || isPlainObject(value),
        message: 'metadata must be a plain object',
      },
      {
        validator: (value: unknown) =>
          value === undefined || getJsonByteLength(value) <= maxBytes,
        message: `metadata must be at most ${maxBytes} bytes`,
      },
    ],
  };
};
