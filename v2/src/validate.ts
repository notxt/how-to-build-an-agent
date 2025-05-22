export const bool = (value: unknown): boolean | Error => {
  if (typeof value === "boolean") return value;
  return new Error(`not a boolean (${typeof value} ${value})`);
};

export const str = (value: unknown): string | Error => {
  if (typeof value === "string") return value;
  return new Error(`not a string (${typeof value} ${value})`);
};

export const numOrNull = (value: unknown): number | null | Error => {
  if (typeof value === "number" || value === null) return value;
  return new Error(`not a number or null (${typeof value} ${value})`);
};

export const validateFactory = <T extends object>(schema: {
  [key in keyof T]: (value: unknown) => T[key] | Error;
}): ((data: unknown) => T | Error) => {
  const validateSchema = (data: unknown): T | Error => {
    if (typeof data !== "object")
      return new Error(`data ${data} is not an object`);
    if (data === null) return new Error(`data ${data} is null`);

    const result: T = {} as T;
    for (const key in schema) {
      const validateAttribute = schema[key];

      if (!(key in data)) return new Error(`${key} is missing`);
      const raw: unknown = (data as any)[key]; // safe because of check above

      const value = validateAttribute(raw);
      if (value instanceof Error)
        return new Error(`${key} is ${value.message}`);

      result[key] = value;
    }

    return result;
  };

  return validateSchema;
};
