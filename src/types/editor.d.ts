export type ProjectFile = {
  fileName: string
  fileContents: string
}

export type Project = {
  name: string
  files: ProjectFile[]
}
