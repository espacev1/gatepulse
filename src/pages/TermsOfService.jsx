import { Helmet } from 'react-helmet-async'
import SEO from '../components/SEO'
import './TermsOfService.css'

export default function TermsOfService() {
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "TermsOfService",
        "name": "VIT-PULSE Terms of Service",
        "url": "https://vitpulse-vitb.vercel.app/terms",
        "logo": "https://vitpulse-vitb.vercel.app/logo_refined.png"
    }

    return (
        <div className="terms-of-service-page">
            <SEO
                title="Terms of Service"
                description="Terms of Service for VIT-PULSE - Vishnu Institute of Technology's Event Management System"
                keywords="terms, conditions, VIT-PULSE, Vishnu Institute of Technology, event management"
            />
            <Helmet>
                <script type="application/ld+json">
                    {JSON.stringify(structuredData)}
                </script>
            </Helmet>

            <div className="container">
                <h1>Terms of Service</h1>
                <p className="last-updated">Last Updated: April 1, 2025</p>

                <section>
                    <h2>1. Acceptance of Terms</h2>
                    <p>By accessing and using VIT-PULSE, you accept and agree to be bound by the terms and provision of this agreement.</p>
                </section>

                <section>
                    <h2>2. Description of Service</h2>
                    <p>VIT-PULSE is an event management platform designed for Vishnu Institute of Technology to facilitate event creation, registration, attendance tracking, and analytics.</p>
                </section>

                <section>
                    <h2>3. User Responsibilities</h2>
                    <p>You agree to:</p>
                    <ul>
                        <li>Provide accurate and complete information</li>
                        <li>Maintain the security of your account credentials</li>
                        <li>Use the platform for legitimate educational purposes</li>
                        <li>Comply with all applicable laws and regulations</li>
                        <li>Not misuse or abuse the system</li>
                    </ul>
                </section>

                <section>
                    <h2>4. Intellectual Property</h2>
                    <p>The platform and its original content, features, and functionality are owned by VIT-PULSE and are protected by international copyright, trademark, and other intellectual property laws.</p>
                </section>

                <section>
                    <h2>5. Privacy</h2>
                    <p>Your privacy is important to us. Our Privacy Policy explains how we collect and use your data.</p>
                </section>

                <section>
                    <h2>6. Disclaimer</h2>
                    <p>The service is provided "as is" without warranties of any kind. We do not guarantee uninterrupted or error-free operation.</p>
                </section>

                <section>
                    <h2>7. Limitation of Liability</h2>
                    <p>VIT-PULSE and Vishnu Institute of Technology shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service.</p>
                </section>

                <section>
                    <h2>8. Changes to Terms</h2>
                    <p>We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes your acceptance of the new terms.</p>
                </section>

                <section>
                    <h2>9. Contact</h2>
                    <p>For questions about these Terms of Service, please contact:</p>
                    <p>Vishnu Institute of Technology<br/>Bhimavaram, Andhra Pradesh, India</p>
                </section>
            </div>

            <div className="page-footer">
                <div className="footer-nav">
                    <Link to="/">← Back to Home</Link>
                    <Link to="/privacy">Privacy Policy</Link>
                </div>
                <p className="copyright">
                    © {new Date().getFullYear()} VIT-PULSE, Vishnu Institute of Technology
                </p>
            </div>
        </div>
    )
}
