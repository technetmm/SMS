export function formDataToObject(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export function emptyToUndefined<T>(value: T) {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }
  return value;
}

export function emptyToNull<T>(value: T) {
  if (typeof value === "string" && value.trim() === "") {
    return null;
  }
  return value;
}

export function emptyToZero<T>(value: T) {
  if (typeof value === "string" && value.trim() === "") {
    return 0;
  }
  return value;
}

export function emptyToFalse<T>(value: T) {
  if (typeof value === "string" && value.trim() === "") {
    return false;
  }
  return value;
}

export function emptyToTrue<T>(value: T) {
  if (typeof value === "string" && value.trim() === "") {
    return true;
  }
  return value;
}

export function emptyToEmptyString<T>(value: T) {
  if (typeof value === "string" && value.trim() === "") {
    return "";
  }
  return value;
}
