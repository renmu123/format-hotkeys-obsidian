export const isString = (input: unknown): input is string =>
  typeof input === "string" || input instanceof String;
