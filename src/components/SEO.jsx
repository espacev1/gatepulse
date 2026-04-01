import { Helmet } from 'react-helmet-async'

const SEO = ({ 
    title, 
    description, 
    keywords, 
    canonical, 
    ogType = 'website', 
    ogImage = '/logo_refined.png', 
    twitterCard = 'summary_large_image' 
}) => {
    const siteTitle = 'VIT-PULSE'
    const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle
    const url = window.location.href

    return (
        <Helmet>
            {/* Standard metadata tags */}
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords || 'VITPULSE, VIT-PULSE, VIT Pulse, Vishnu Institute of Technology, event management, digital tickets, QR code, attendance tracking'} />
            <link rel="canonical" href={canonical || url} />
            
            {/* Branding for browsers/search */}
            <meta name="application-name" content="VITPULSE" />
            <meta name="apple-mobile-web-app-title" content="VITPULSE" />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={ogType} />
            <meta property="og:site_name" content="VITPULSE" />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={ogImage} />
            <meta property="og:url" content={url} />

            {/* Twitter */}
            <meta name="twitter:card" content={twitterCard} />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={ogImage} />
        </Helmet>
    )
}

export default SEO
