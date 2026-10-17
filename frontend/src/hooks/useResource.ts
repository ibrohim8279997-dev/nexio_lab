import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../lib/api'
import { useI18n } from '../i18n'

export function useResource<T>(loader: () => Promise<T>, dependencies: unknown[] = []) {
  const { t } = useI18n()
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setData(await loader())
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : t('common.loadError'))
    } finally {
      setLoading(false)
    }
  }, [t, ...dependencies]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void reload()
  }, [reload])

  return { data, loading, error, reload, setData }
}
