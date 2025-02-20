import { type ReadonlySignal } from '@preact/signals'
import { BaseStore } from '@/stores/base.ts'
import { type ColorTheme, type Theme } from '@/types/theme.ts'
import { CyclablePersistence } from '@/persistence/mod.ts'

const themeList: Theme[] = ['system', 'light', 'dark']
const colorThemeList: ColorTheme[] = [
  'grey',
  'blue',
  'red',
  'green',
  'orange',
  'purple',
]

export class UIStore extends BaseStore {
  #themePersistence: CyclablePersistence<Theme[]>
  #colorThemePersistence: CyclablePersistence<ColorTheme[]>
  #mediaQuery: MediaQueryList
  theme: ReadonlySignal<Theme | undefined>
  colorTheme: ReadonlySignal<ColorTheme | undefined>

  constructor() {
    super('uiStore')
    this.#mediaQuery = globalThis.matchMedia(
      '(prefers-color-scheme: dark)',
    )

    this.#themePersistence = new CyclablePersistence('theme', themeList)
    this.#colorThemePersistence = new CyclablePersistence(
      'colorTheme',
      colorThemeList,
    )

    this.theme = this.#themePersistence.current

    this.colorTheme = this.#colorThemePersistence.current

    // Apply initial themes
    this.#applyTheme(this.theme.value)
    this.#applyColorTheme(this.colorTheme.value)

    // Listen for system theme changes
    this.#mediaQuery.addEventListener('change', () => {
      if (this.theme.value === 'system') {
        this.#applySystemTheme()
      }
    })

    this.logger.info('UIStore initialized', {
      initialTheme: this.theme.value,
      initialColorTheme: this.colorTheme.value,
    })
  }

  #getSystemTheme(): 'light' | 'dark' {
    return this.#mediaQuery.matches ? 'dark' : 'light'
  }

  #applySystemTheme() {
    const systemTheme = this.#getSystemTheme()
    document.documentElement.dataset.theme = systemTheme
  }

  #applyTheme(theme: Theme | undefined) {
    if (!theme) return

    if (theme === 'system') {
      this.#applySystemTheme()
    } else {
      document.documentElement.dataset.theme = theme
    }
  }

  #applyColorTheme(colorTheme: ColorTheme | undefined) {
    if (!colorTheme) return
    document.documentElement.dataset.color = colorTheme
  }

  toggleTheme() {
    this.logger.debug('Toggling theme', {
      currentTheme: this.theme.value,
    })
    this.#themePersistence.incIndex()
    this.#applyTheme(this.theme.value)
  }

  toggleColorTheme() {
    this.logger.debug('Toggling color theme', {
      currentColorTheme: this.colorTheme.value,
    })
    this.#colorThemePersistence.incIndex()
    this.#applyColorTheme(this.colorTheme.value)
  }

  getCurrentTheme(): 'light' | 'dark' {
    return this.theme.value === 'system' || this.theme.value === undefined
      ? this.#getSystemTheme()
      : this.theme.value
  }
}
