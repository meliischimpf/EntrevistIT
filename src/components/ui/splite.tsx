'use client'

import React, { Suspense, lazy } from 'react'
const Spline = lazy(() => import('@splinetool/react-spline'))

interface SplineSceneProps {
  scene: string
  className?: string
  fallback?: React.ReactNode
}

export function SplineScene({ scene, className, fallback }: SplineSceneProps) {
  const [hasError, setHasError] = React.useState(false)

  if (hasError && fallback) {
    return <>{fallback}</>
  }

  return (
    <div className="w-full h-full bg-transparent">
      <Suspense 
        fallback={
          <div className="w-full h-full flex items-center justify-center bg-transparent">
            <span className="loader"></span>
          </div>
        }
      >
        <Spline
          scene={scene}
          className={`w-full h-full ${className || ''}`}
          onError={() => setHasError(true)}
          style={{ background: 'transparent' }}
        />
      </Suspense>
    </div>
  )
}