export function formDataToObject(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export function emptyToUndefined<T>(value: T) {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }
  return value;
}
