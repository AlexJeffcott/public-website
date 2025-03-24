export function getFileType(filename: string) {
  if (isTextFile(filename)) {
    return 'text'
  } else if (isImageFile(filename)) {
    return 'image'
  } else if (isAudioFile(filename)) {
    return 'audio'
  } else if (isVideoFile(filename)) {
    return 'video'
  }
  return 'unknown'
}

const textExtensions = [
  '.txt',
  '.md',
  '.js',
  '.ts',
  '.jsx',
  '.tsx',
  '.html',
  '.css',
  '.scss',
  '.sass',
  '.less',
  '.json',
  '.xml',
  '.yaml',
  '.yml',
  '.csv',
  '.log',
  '.ini',
  '.conf',
  '.cfg',
  '.config',
  '.sh',
  '.bash',
  '.py',
  '.java',
  '.c',
  '.cpp',
  '.h',
  '.hpp',
  '.cs',
  '.php',
  '.rb',
  '.go',
  '.rs',
  '.swift',
  '.kt',
  '.sql',
  '.env',
  '.gitignore',
  '.htaccess',
  '.properties',
  '.toml',
  '.rst',
  '.tex',
  '.markdown',
  '.rtf',
  '.svg',
  '.diff',
  '.patch',
  '.bat',
  '.txt',
]

/**
 * Checks if a filename has a common text file extension
 * @param filename The filename to check
 * @returns True if the file has a text file extension, false otherwise
 */
export function isTextFile(filename: string): boolean {
  if (!filename) return false
  const extension = filename.toLowerCase().match(/\.[^.]*$/)?.[0]
  return extension !== undefined && textExtensions.includes(extension)
}

const audioExtensions = [
  '.mp3',
  '.wav',
  '.aac',
  '.ogg',
  '.flac',
  '.m4a',
  '.wma',
  '.aiff',
  '.alac',
  '.opus',
  '.mid',
  '.midi',
  '.amr',
  '.ape',
  '.au',
  '.mka',
  '.pcm',
  '.ra',
  '.voc',
  '.wv',
]

/**
 * Checks if a filename has a common audio file extension
 * @param filename The filename to check
 * @returns True if the file has an audio file extension, false otherwise
 */
export function isAudioFile(filename: string): boolean {
  if (!filename) return false
  const extension = filename.toLowerCase().match(/\.[^.]*$/)?.[0]
  return extension !== undefined && audioExtensions.includes(extension)
}

const videoExtensions = [
  '.mp4',
  '.avi',
  '.mkv',
  '.mov',
  '.wmv',
  '.flv',
  '.webm',
  '.m4v',
  '.mpeg',
  '.mpg',
  '.3gp',
  '.mts',
  '.m2ts',
  '.vob',
  '.ogv',
  '.rm',
  '.rmvb',
  '.asf',
  '.divx',
]

/**
 * Checks if a filename has a common video file extension
 * @param filename The filename to check
 * @returns True if the file has an video file extension, false otherwise
 */
export function isVideoFile(filename: string): boolean {
  if (!filename) return false
  const extension = filename.toLowerCase().match(/\.[^.]*$/)?.[0]
  return extension !== undefined && videoExtensions.includes(extension)
}

const imageExtensions = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.bmp',
  '.webp',
  '.svg',
  '.tiff',
  '.tif',
  '.ico',
  '.heic',
  '.heif',
  '.raw',
  '.cr2',
  '.nef',
  '.arw',
  '.dng',
  '.psd',
  '.ai',
  '.eps',
]

/**
 * Checks if a filename has a common image file extension
 * @param filename The filename to check
 * @returns True if the file has an image file extension, false otherwise
 */
export function isImageFile(filename: string): boolean {
  if (!filename) return false
  const extension = filename.toLowerCase().match(/\.[^.]*$/)?.[0]
  return extension !== undefined && imageExtensions.includes(extension)
}

