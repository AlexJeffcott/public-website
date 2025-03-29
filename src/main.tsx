import { render } from 'preact'
import { StoresProvider } from '@/contexts/stores.tsx'
import { initActionListeners } from '@/actions/init-action-listeners.ts'
import { createStores } from '@/stores/mod.ts'
import { EditImgPage, FSPage, GenImgPage, HomePage } from '@/pages/mod.ts'
import '@/global.css'

const element = document.body

if (element instanceof HTMLElement) {
  const stores = createStores()
  initActionListeners(element, stores)

  const Router = () => {
    const path = stores.routerStore.path.value
    switch (path) {
      case '/edit-img':
        return <EditImgPage />
      case '/gen-img':
        return <GenImgPage />
      case '/fs':
        return <FSPage />
      default:
        return <HomePage />
    }
  }

  render(
    <StoresProvider stores={stores}>
      <Router />
    </StoresProvider>,
    element,
  )
}
