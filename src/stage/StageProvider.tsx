import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react'
import { clampIndex, stageReducer, type StageEvent, type StageState } from '@/stage/stageMachine'

type StageContextValue = {
  state: StageState
  dispatch: (event: StageEvent) => void
  /** Panel que se está mostrando: el destino si hay una transición en curso. */
  displayIndex: number
}

const StageContext = createContext<StageContextValue | null>(null)

export function StageProvider({ children, initialIndex = 0 }: { children: ReactNode; initialIndex?: number }) {
  const [state, dispatch] = useReducer(stageReducer, {
    mode: 'loading',
    activeIndex: clampIndex(initialIndex),
    lock: true,
    transition: null,
    queued: null,
  })
  const value = useMemo(
    () => ({ state, dispatch, displayIndex: state.transition?.to ?? state.activeIndex }),
    [state],
  )
  return <StageContext.Provider value={value}>{children}</StageContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStage(): StageContextValue {
  const ctx = useContext(StageContext)
  if (!ctx) throw new Error('useStage() fuera de <StageProvider>')
  return ctx
}
