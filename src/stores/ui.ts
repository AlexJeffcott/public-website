import { type ReadonlySignal } from '@preact/signals'
import { BaseStore } from '@/stores/base.ts'
import { PrimitivePersistence } from '@/persistence/mod.ts'

export class UIStore extends BaseStore {
  #colorThemePersistence: PrimitivePersistence<string>
  colorTheme: ReadonlySignal<string>

  constructor() {
    super('uiStore')

    this.#colorThemePersistence = new PrimitivePersistence('colorTheme', 'grey')

    this.colorTheme = this.#colorThemePersistence.current

    this.#applyColorTheme(this.colorTheme.value)

    this.logger.info('UIStore initialized', {
      initialColorTheme: this.colorTheme.value,
    })
  }

  #applyColorTheme(color: string) {
    if (!color) return
    document.documentElement.style.setProperty('--base-color', color)
  }

  setColorTheme(color: string) {
    this.logger.debug('Seting color theme', {
      currentColorTheme: this.colorTheme.value,
    })
    this.#colorThemePersistence.set(color)
    this.#applyColorTheme(this.colorTheme.value)
  }
}
