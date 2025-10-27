/* 'use client'

import { SplineScene } from "@/components/ui/splite";
import { Card } from "@/components/ui/card"
import { Spotlight } from "@/components/ui/spotlight"
 
export function SplineSceneBasic() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-transparent">
      <div className="relative w-full h-full">
        <SplineScene 
          scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
          className="w-full h-full"
          fallback={
            <div className="w-full h-full flex items-center justify-center bg-transparent">
              <div className="text-center">
                <div className="text-6xl mb-2">🤖</div>
                <p className="text-blue-600 font-medium">Entrevistador AI</p>
              </div>
            </div>
          }
        />
      </div>
    </div>
  )
} */