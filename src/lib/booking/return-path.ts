/** Only public studio routes may be used as an authentication return destination. */
export function studioReturnPath(value: string | null): string | null {
  if (!value || !value.startsWith("/studios/") || /[\\\r\n]/.test(value))
    return null;
  try {
    const url = new URL(value, "https://oqupy.invalid");
    return url.origin === "https://oqupy.invalid" &&
      url.pathname.startsWith("/studios/")
      ? `${url.pathname}${url.search}`
      : null;
  } catch {
    return null;
  }
}
