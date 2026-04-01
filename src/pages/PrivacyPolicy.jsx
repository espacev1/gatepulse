import { Helmet } from 'react-helmet-async'
import SEO from '../components/SEO'
import './PrivacyPolicy.css'

export default function PrivacyPolicy() {
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "PrivacyPolicy",
        "name": "VIT-PULSE Privacy Policy",
        "url": "https://vitpulse-vitb.vercel.app/privacy",
        "logo": "https://vitpulse-vitb.vercel.app/logo_refined.png",
        "sameAs": [
            "https://linkedin.com/company/vitpulse"
        ]
    }

    return (
        <div className="privacy-policy-page">
            <SEO
                title="Privacy Policy"
                description="Privacy Policy for VIT-PULSE - Vishnu Institute of Technology's Event Management System"
                keywords="privacy, data protection, VIT-PULSE, Vishnu Institute of Technology"
            />
            <Helmet>
                <script type="application/ld+json">
                    {JSON.stringify(structuredData)}
                </script>
            </Helmet>

            <div className="container">
                <h1>Privacy Policy</h1>
                <p className="last-updated">Last Updated: April 1, 2025</p>

                <section>
                    <h2>1. Introduction</h2>
                    <p>Welcome to VIT-PULSE ("we", "our", "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our event management platform.</p>
                </section>

                <section>
                    <h2>2. Information We Collect</h2>
                    <p>We may collect personal information that you provide directly to us when you:</p>
                    <ul>
                        <li>Register for an account</li>
                        <li>Create or attend events</li>
                        <li>Use QR codes for event check-in</li>
                        <li>Contact us for support</li>
                    </ul>
                    <p>Information collected may include:</p>
                    <ul>
                        <li>Name and email address</li>
                        <li>Phone number</li>
                        <li>Profile picture</li>
                        <li>Event attendance records</li>
                        <li>Role-specific data (student, faculty, staff, jury)</li>
                    </ul>
                </section>

                <section>
                    <h2>3. How We Use Your Information</h2>
                    <p>We use the information we collect to:</p>
                    <ul>
                        <li>Provide and maintain our services</li>
                        <li>Manage event registrations and attendance</li>
                        <li>Generate analytics for event organizers</li>
                        <li>Improve user experience</li>
                        <li>Communicate important updates</li>
                    </ul>
                </section>

                <section>
                    <h2>4. Data Security</h2>
                    <p>We implement appropriate technical and organizational security measures to protect your personal information. Our platform uses Supabase for secure data storage and transmission.</p>
                </section>

                <section>
                    <h2>5. Data Retention</h2>
                    <p>We retain your information only as long as necessary to fulfill the purposes outlined in this policy, unless a longer retention period is required by law.</p>
                </section>

                <section>
                    <h2>6. Your Rights</h2>
                    <p>You have the right to:</p>
                    <ul>
                        <li>Access your personal data</li>
                        <li>Correct inaccurate data</li>
                        <li>Request deletion of your data</li>
                        <li>Withdraw consent</li>
                    </ul>
                </section>

                <section>
                    <h2>7. Contact Us</h2>
                    <p>If you have questions about this Privacy Policy, please contact us at:</p>
                    <p>Vishnu Institute of Technology<br/>Bhimavaram, Andhra Pradesh, India</p>
                </section>
            </div>

            <div className="page-footer">
                <div className="footer-nav">
                    <Link to="/">← Back to Home</Link>
                    <Link to="/terms">Terms of Service</Link>
                </div>
                <p className="copyright">
                    © {new Date().getFullYear()} VIT-PULSE, Vishnu Institute of Technology
                </p>
            </div>
        </div>
    )
}
