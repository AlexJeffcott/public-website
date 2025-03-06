export type ProjectFile = {
  fileName: string
  fileContents: string | ArrayBuffer
}

export type Project = {
  name: string
  files: ProjectFile[]
}
