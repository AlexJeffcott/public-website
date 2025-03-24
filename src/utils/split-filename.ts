export function splitFilename(
  filename: string,
): { filename: string; ext: string } {
  const ext = filename.split('.').at(-1)?.toLowerCase()

  if (ext === undefined || `.${ext}` === filename) {
    return { filename, ext: '' }
  } else {
    return { filename: filename.slice(0, -(ext.length + 1)), ext: ext }
  }
}
