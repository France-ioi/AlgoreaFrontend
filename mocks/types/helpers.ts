export type NullableValues<T> = T extends Record<string, any>
  ? { [Key in keyof T]: NullableValues<T[Key]> }
  : T | null;
