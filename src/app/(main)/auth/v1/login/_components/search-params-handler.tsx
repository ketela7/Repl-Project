'use client'

import { useSearchParams } from 'next/navigation'


interface SearchParamsHandlerProps {
  children: (isReauth: boolean) => ReactNode
}

export function SearchParamsHandler({ children }: SearchParamsHandlerProps) {
  const searchParams = useSearchParams()
  const isReauth = searchParams.get('reauth') === 'drive'

  return <>{children(isReauth)}</>
}
