/**
 * Replace cyclic references in an object with '[Circular]'.
 * @param obj - A JSON-serializable object.
 */
export const decycle = (obj: object) => {
  const seen = new WeakSet();

  return JSON.parse(
    JSON.stringify(obj, (_key: string, value: unknown) => {
      if (value != null && typeof value === 'object') {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }
      return value;
    }),
  ) as object;
};
