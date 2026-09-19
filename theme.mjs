export function resolveTheme(saved, prefersDark) {
  return saved === 'light' || saved === 'dark' ? saved : prefersDark ? 'dark' : 'light';
}

export function toggleTheme(current) {
  return current === 'dark' ? 'light' : 'dark';
}
