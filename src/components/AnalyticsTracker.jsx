import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function AnalyticsTracker() {
  const location = useLocation()

  useEffect(() => {
    // Track page views for SPA navigation
    const handleRouteChange = () => {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('config', 'G-18DKTNLCCW', {
          'page_path': window.location.pathname + window.location.search
        })
      }
    }

    handleRouteChange()
  }, [location])

  return null // This component doesn't render anything
}
