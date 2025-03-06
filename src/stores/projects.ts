import {
  computed,
  type ReadonlySignal,
  type Signal,
  signal,
} from '@preact/signals'
import { BaseStore } from '@/stores/base.ts'
import { SerializablePersistence } from '@/persistence/mod.ts'
import { type Project, type ProjectFile } from '@/types/editor.d.ts'
import DEFAULT_PROJECT_IMPORT from '@/stores/default-projects.json' with {
  type: 'json',
}

const DEFAULT_PROJECT = DEFAULT_PROJECT_IMPORT as Project

export class ProjectsStore extends BaseStore {
  #projectsPersistence: SerializablePersistence<Project[]>
  currentProjectName: Signal<string>
  projects: ReadonlySignal<Project[]>
  currentProject: ReadonlySignal<Project | undefined>
  currentFileIndex: Signal<number>
  currentFile: ReadonlySignal<ProjectFile | undefined>

  constructor() {
    super('projectsStore')
    this.#projectsPersistence = new SerializablePersistence(
      'projects',
      [DEFAULT_PROJECT],
    )

    this.projects = computed(() => {
      return this.#projectsPersistence.current.value ?? []
    })

    this.currentProjectName = signal(DEFAULT_PROJECT.name)
    this.currentProject = computed(() => {
      return this.projects.value.find((project: Project) =>
        project.name === this.currentProjectName.value
      )
    })
    this.currentFileIndex = signal(0)
    this.currentFile = computed(() => {
      return this.currentProject.value?.files.at(this.currentFileIndex.value)
    })

    this.logger.info('ProjectsStore initialized', {
      currentProject: this.currentProject.value,
    })

    this.setProject = this.setProject.bind(this)
    this.setFileIndex = this.setFileIndex.bind(this)
    this.reset = this.reset.bind(this)
  }

  setProject(projectName: string): void {
    this.currentProjectName.value = projectName
    this.setFileIndex(0)
  }

  setFileIndex(index: number): void {
    this.currentFileIndex.value = index
  }

  createProject(projectName: string): void {
    const projects = this.#projectsPersistence.current.peek()

    if (projects) {
      const count: number = projects.reduce(
        (acc, cur) => cur.name.startsWith(projectName) ? acc++ : acc,
        0,
      )
      const name = `${projectName}${count ? '-' + count : ''}`
      projects.push({
        name,
        files: [{
          fileName: 'new-file',
          fileContents: '',
        }],
      })

      this.#projectsPersistence.set(projects)
      this.setProject(name)
    }
  }

  createFile(name: string): void {
    const currentProject = this.currentProject.peek()
    const projects = this.#projectsPersistence.current.peek()?.map((p) => {
      if (p.name === currentProject?.name) {
        const count = currentProject.files.reduce(
          (acc, cur) => cur.fileName.startsWith(name) ? acc++ : acc,
          0,
        )
        return {
          name: currentProject.name,
          files: [...currentProject.files, {
            fileName: `${name}${count ? '-' + count : ''}`,
            fileContents: '',
          }],
        }
      }

      return p
    })

    if (projects) {
      this.currentFileIndex.value = this.currentFileIndex.value + 1
      this.#projectsPersistence.set(projects)
    }
  }

  renameFile(index: number, name: string): void {
    const projects = this.#projectsPersistence.current.peek()
    const currentProject = this.currentProject.peek()
    if (projects && currentProject) {
      this.#projectsPersistence.set(projects.map((p) => {
        if (p.name === currentProject.name) {
          return {
            name: p.name,
            files: currentProject.files.map((f, i) => {
              if (i === index) {
                return { fileName: name, fileContents: f.fileContents }
              }
              return f
            }),
          }
        }
        return p
      }))
    }
  }

  deleteFile(index: number): void {
    let projects = this.#projectsPersistence.current.peek()
    const currentProject = this.currentProject.peek()
    if (currentProject && projects) {
      projects = projects.map((p) => {
        if (p.name === currentProject.name) {
          if (currentProject.files.length < 2) {
            return {
              name: currentProject.name,
              files: [{ fileName: 'new-file', fileContents: '' }],
            }
          }
          return {
            name: currentProject.name,
            files: currentProject.files.filter((_, i) => i !== index),
          }
        }
        return p
      })

      this.currentFileIndex.value = Math.max(0, index - 1)

      if (projects) {
        this.#projectsPersistence.set(projects)
      }
    }
  }

  deleteProject(): void {
    const projects = this.#projectsPersistence.current.peek()
    if (projects) {
      if (projects.length < 2) {
        this.reset()
      } else {
        const cachedName = this.currentProjectName.peek()
        this.currentProjectName.value = DEFAULT_PROJECT.name
        this.currentFileIndex.value = 0
        this.#projectsPersistence.set(
          projects?.filter((p) => cachedName !== p.name),
        )
      }
    }
  }

  updateProjectFileContents(fileContents: ProjectFile['fileContents']): void {
    const projects = this.#projectsPersistence.current.peek()?.map(
      (p) => {
        const index = this.currentFileIndex.peek()
        const fileName = this.currentFile.peek()?.fileName
        const projectName = this.currentProjectName.peek()
        if (
          p.name === projectName &&
          index !== undefined && fileName !== undefined
        ) {
          p.files[index] = {
            fileName,
            fileContents,
          }
        }

        return p
      },
    )

    if (projects) {
      this.#projectsPersistence.set(projects)
    }
  }

  reset() {
    this.currentProjectName.value = DEFAULT_PROJECT.name
    this.currentFileIndex.value = 0
    this.#projectsPersistence.set([DEFAULT_PROJECT])
  }
}
