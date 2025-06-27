import { useState, useEffect, useCallback, useRef } from 'react'

import { LoadingStage, ProgressiveLoadingMetrics } from '@/lib/google-drive/progressive-fields'

interface ProgressiveFileData {
  basic?: any
  essential?: any
  extended?: any
}

interface UseProgressiveFileDetailsOptions {
  fileId: string
  isOpen: boolean
  onStageComplete?: (stage: LoadingStage, data: any) => void
  onError?: (stage: LoadingStage, error: Error) => void
}

interface UseProgressiveFileDetailsReturn {
  data: ProgressiveFileData
  loading: {
    basic: boolean
    essential: boolean
    extended: boolean
  }
  error: {
    basic?: string
    essential?: string
    extended?: string
  }
  metrics: ProgressiveLoadingMetrics
  currentStage: LoadingStage
  progress: number
  retry: (stage?: LoadingStage) => void
}

export function useProgressiveFileDetails({
  fileId,
  isOpen,
  onStageComplete,
  onError,
}: UseProgressiveFileDetailsOptions): UseProgressiveFileDetailsReturn {
  const [data, setData] = useState<ProgressiveFileData>({})
  const [loading, setLoading] = useState({
    basic: false,
    essential: false,
    extended: false,
  })
  const [error, setError] = useState<{
    basic?: string
    essential?: string
    extended?: string
  }>({})
  const [currentStage, setCurrentStage] = useState<LoadingStage>(LoadingStage.BASIC)
  const [metrics, setMetrics] = useState<ProgressiveLoadingMetrics>({
    basicLoadTime: 0,
    essentialLoadTime: 0,
    extendedLoadTime: 0,
    totalLoadTime: 0,
    cacheHit: false,
  })

  const abortControllerRef = useRef<AbortController | null>(null)
  const startTimeRef = useRef<number>(0)

  // Calculate progress based on completed stages
  const progress = (() => {
    let completed = 0
    if (data.basic) completed += 33
    if (data.essential) completed += 33
    if (data.extended) completed += 34
    return completed
  })()

  const fetchStage = useCallback(
    async (stage: LoadingStage) => {
      if (!fileId || !isOpen) return

      const stageKey = stage as keyof typeof loading
      setLoading((prev) => ({ ...prev, [stageKey]: true }))
      setError((prev) => ({ ...prev, [stageKey]: undefined }))

      try {
        const stageStartTime = Date.now()

        let endpoint = `/api/drive/files/${fileId}`
        if (stage === LoadingStage.ESSENTIAL) {
          endpoint += '/essential'
        } else if (stage === LoadingStage.EXTENDED) {
          endpoint += '/extended'
        } else {
          endpoint += '/details' // fallback to existing endpoint for basic
        }

        const response = await fetch(endpoint, {
          signal: abortControllerRef.current?.signal,
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch ${stage} details`)
        }

        const result = await response.json()
        const stageLoadTime = Date.now() - stageStartTime

        if (result.success) {
          setData((prev) => ({ ...prev, [stageKey]: result.data }))
          setMetrics((prev) => ({
            ...prev,
            [`${stage}LoadTime`]: stageLoadTime,
            cacheHit: result.cached || prev.cacheHit,
            totalLoadTime: Date.now() - startTimeRef.current,
          }))

          onStageComplete?.(stage, result.data)

          // Auto-progress to next stage
          if (stage === LoadingStage.BASIC) {
            setCurrentStage(LoadingStage.ESSENTIAL)
          } else if (stage === LoadingStage.ESSENTIAL) {
            setCurrentStage(LoadingStage.EXTENDED)
          } else {
            setCurrentStage(LoadingStage.COMPLETE)
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : `Failed to load ${stage} details`
        setError((prev) => ({ ...prev, [stageKey]: errorMessage }))
        onError?.(stage, err instanceof Error ? err : new Error(errorMessage))
      } finally {
        setLoading((prev) => ({ ...prev, [stageKey]: false }))
      }
    },
    [fileId, isOpen, onStageComplete, onError]
  )

  const retry = useCallback(
    (stage?: LoadingStage) => {
      if (stage) {
        fetchStage(stage)
      } else {
        // Retry current stage or restart from basic
        const retryStage = currentStage === LoadingStage.COMPLETE ? LoadingStage.BASIC : currentStage
        fetchStage(retryStage)
      }
    },
    [fetchStage, currentStage]
  )

  // Start progressive loading when dialog opens
  useEffect(() => {
    if (isOpen && fileId) {
      // Reset state
      setData({})
      setError({})
      setCurrentStage(LoadingStage.BASIC)
      startTimeRef.current = Date.now()

      // Create new abort controller
      abortControllerRef.current = new AbortController()

      // Start with basic stage
      fetchStage(LoadingStage.BASIC)

      return () => {
        abortControllerRef.current?.abort()
      }
    }
  }, [isOpen, fileId, fetchStage])

  // Auto-load next stages
  useEffect(() => {
    if (currentStage === LoadingStage.ESSENTIAL && !loading.essential && !data.essential && !error.essential) {
      fetchStage(LoadingStage.ESSENTIAL)
    } else if (currentStage === LoadingStage.EXTENDED && !loading.extended && !data.extended && !error.extended) {
      // Load extended in background with small delay
      const timer = setTimeout(() => {
        fetchStage(LoadingStage.EXTENDED)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [currentStage, loading, data, error, fetchStage])

  return {
    data,
    loading,
    error,
    metrics,
    currentStage,
    progress,
    retry,
  }
}
