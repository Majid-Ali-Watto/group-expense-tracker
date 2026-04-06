export function toCapitalize() {
  return this.replace(/\b\w/g, (char) => char.toUpperCase())
}
