import { createContext, type FunctionalComponent } from 'preact'
import { useContext } from 'preact/hooks'
import type { Stores } from '@/stores/mod.ts'

const StoresContext = createContext<Stores | null>(null)

type StoresProviderProps = {
  stores: Stores
}

export const StoresProvider: FunctionalComponent<StoresProviderProps> = ({
  stores,
  children,
}) => (
  <StoresContext.Provider value={stores}>
    {children}
  </StoresContext.Provider>
)

export function useStores() {
  const stores = useContext(StoresContext)
  if (!stores) {
    throw new Error(
      'useStores must be used within a StoresProvider',
    )
  }
  return stores
}
