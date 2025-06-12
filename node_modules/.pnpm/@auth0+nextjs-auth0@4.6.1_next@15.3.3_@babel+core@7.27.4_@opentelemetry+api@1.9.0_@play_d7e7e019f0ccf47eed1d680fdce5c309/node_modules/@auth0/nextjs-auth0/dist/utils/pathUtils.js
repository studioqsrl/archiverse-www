export function ensureTrailingSlash(value) {
    return value && !value.endsWith("/") ? `${value}/` : value;
}
export function ensureNoLeadingSlash(value) {
    return value && value.startsWith("/")
        ? value.substring(1, value.length)
        : value;
}
export const removeTrailingSlash = (path) => path.endsWith("/") ? path.slice(0, -1) : path;
