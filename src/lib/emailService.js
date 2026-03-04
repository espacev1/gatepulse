import emailjs from 'emailjs-com';

/**
 * HOW TO GET EMAILJS KEYS:
 * 1. Sign up at https://www.emailjs.com/
 * 2. SERVICE_ID: Go to "Email Services" -> "Add New Service" (e.g. Gmail). Use the ID shown.
 * 3. TEMPLATE_ID: Go to "Email Templates" -> "Create New Template". 
 *    - Use variables like {{to_name}}, {{qr_code}}, {{event_name}} in your design.
 *    - Save and use the Template ID.
 * 4. PUBLIC_KEY: Go to "Account" -> "API Keys" -> "Public Key".
 */

const SERVICE_ID = 'service_gatepulse'; // Replace with actual Service ID
const TEMPLATE_ID = 'template_qr_dispatch'; // Replace with actual Template ID
const PUBLIC_KEY = 'user_XXXXXXXXXXXX'; // Replace with actual Public Key

export const sendQRCodeEmail = async (userEmail, userName, qrCode, eventName) => {
    try {
        const templateParams = {
            to_email: userEmail,
            to_name: userName,
            qr_code: qrCode,
            event_name: eventName || 'Gate Pulse Secure Sector',
            date: new Date().toLocaleDateString(),
        };

        const response = await emailjs.send(
            SERVICE_ID,
            TEMPLATE_ID,
            templateParams,
            PUBLIC_KEY
        );

        console.log('Email dispatched successfully:', response.status, response.text);
        return { success: true, message: 'Credential dispatched to email.' };
    } catch (error) {
        console.error('Email dispatch failed:', error);
        return { success: false, message: 'Email service failure. Please check your API configuration.' };
    }
};
