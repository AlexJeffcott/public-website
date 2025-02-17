import { type Signal, signal } from '@preact/signals'
import { BaseStore } from './base.ts'
import { type ColorTheme, type Theme } from '../types/theme.ts'

export class UIStore extends BaseStore {
  theme: Signal<Theme>
  colorTheme: Signal<ColorTheme>
  #mediaQuery: MediaQueryList

  constructor() {
    super('uiStore')
    this.#mediaQuery = globalThis.matchMedia(
      '(prefers-color-scheme: dark)',
    )
    const savedTheme = (localStorage.getItem('theme') as Theme) ||
      'system'
    const savedColorTheme =
      (localStorage.getItem('colorTheme') as ColorTheme) ||
      'grey'

    this.theme = signal(savedTheme)
    this.colorTheme = signal(savedColorTheme)

    // Initialize themes
    this.#applyTheme(savedTheme)
    this.#applyColorTheme(savedColorTheme)

    // Listen for system theme changes
    this.#mediaQuery.addEventListener('change', () => {
      if (this.theme.value === 'system') {
        this.#applySystemTheme()
      }
    })

    this.logger.info('UIStore initialized', {
      initialTheme: savedTheme,
      initialColorTheme: savedColorTheme,
    })
  }

  #getSystemTheme(): 'light' | 'dark' {
    return this.#mediaQuery.matches ? 'dark' : 'light'
  }

  #applySystemTheme() {
    const systemTheme = this.#getSystemTheme()
    document.documentElement.dataset.theme = systemTheme
  }

  #applyTheme(theme: Theme) {
    if (theme === 'system') {
      this.#applySystemTheme()
    } else {
      document.documentElement.dataset.theme = theme
    }
    localStorage.setItem('theme', theme)
  }

  #applyColorTheme(colorTheme: ColorTheme) {
    document.documentElement.dataset.color = colorTheme
    localStorage.setItem('colorTheme', colorTheme)
  }

  toggleTheme() {
    this.logger.debug('Toggling theme', {
      currentTheme: this.theme.value,
    })
    const themeOrder: Theme[] = ['light', 'dark', 'system']
    const currentIndex = themeOrder.indexOf(this.theme.value)
    const nextIndex = (currentIndex + 1) % themeOrder.length
    const newTheme = themeOrder[nextIndex]

    this.theme.value = newTheme
    this.#applyTheme(newTheme)
  }

  toggleColorTheme() {
    this.logger.debug('Toggling color theme', {
      currentColorTheme: this.colorTheme.value,
    })
    const colorThemeOrder: ColorTheme[] = [
      'blue',
      'red',
      'green',
      'orange',
      'purple',
      'grey',
    ]
    const currentIndex = colorThemeOrder.indexOf(
      this.colorTheme.value,
    )
    const nextIndex = (currentIndex + 1) % colorThemeOrder.length
    const newColorTheme = colorThemeOrder[nextIndex]

    this.colorTheme.value = newColorTheme
    this.#applyColorTheme(newColorTheme)
  }

  getCurrentTheme(): 'light' | 'dark' {
    return this.theme.value === 'system'
      ? this.#getSystemTheme()
      : this.theme.value
  }
}
