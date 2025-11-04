import React from 'react'

export default function Loader(): JSX.Element {
  return (
    <div role="status" aria-live="polite" aria-label="Cargando" className="flex items-center gap-3">
      <div className="loader" aria-hidden="true" />
      <span className="sr-only">Cargando…</span>
    </div>
  )
}
