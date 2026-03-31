/**
 * Email Service Utility (using Resend)
 * 
 * Instructions:
 * 1. Add VITE_RESEND_API_KEY to your .env file
 * 2. Ensure your domain is verified in Resend (defaults to resend.dev for testing)
 */

const RESEND_API_URL = 'https://api.resend.com/emails';
const API_KEY = import.meta.env.VITE_RESEND_API_KEY;

// Default "From" address (use a verified domain in production)
const FROM_EMAIL = 'VITPULSE <onboarding@resend.dev>';

/**
 * Common Send Function
 */
async function sendEmail({ to, subject, html }) {
    if (!API_KEY) {
        console.warn('⚠️ [EmailService] Resend API Key missing. Skipping email send.');
        return { error: 'API Key missing' };
    }

    try {
        const response = await fetch(RESEND_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: FROM_EMAIL,
                to: Array.isArray(to) ? to : [to],
                subject,
                html
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to send email');
        
        console.log(`✅ [EmailService] Email sent to ${to}: ${subject}`);
        return { data };
    } catch (error) {
        console.error('❌ [EmailService] Error:', error.message);
        return { error: error.message };
    }
}

/**
 * 1. Send Ticket Email
 */
export async function sendTicketEmail(participant, event, ticket) {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${ticket.qr_token}`;
    
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #0084FF;">Your Event Ticket is Ready!</h2>
            <p>Hi <strong>${participant.full_name}</strong>,</p>
            <p>You have successfully registered for <strong>${event.name}</strong>.</p>
            
            <div style="background: #f9f9f9; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
                <img src="${qrUrl}" alt="QR Ticket" style="width: 200px; height: 200px; display: block; margin: 0 auto;" />
                <p style="font-size: 12px; color: #666; margin-top: 10px;">Scan this at the event entrance</p>
                <div style="font-family: monospace; font-size: 14px; font-weight: bold; margin-top: 5px;">${ticket.qr_token}</div>
            </div>

            <div style="font-size: 14px; color: #444;">
                <p><strong>Venue:</strong> ${event.location}</p>
                <p><strong>Time:</strong> ${new Date(event.start_time).toLocaleString()}</p>
            </div>
            
            <p style="font-size: 12px; color: #888; margin-top: 30px;">
                Please carry this digital ticket with you. Operational staff will scan it for verification.
            </p>
        </div>
    `;

    return sendEmail({
        to: participant.email,
        subject: `🎟️ Ticket for ${event.name} - VITPULSE`,
        html
    });
}

/**
 * 2. Notify Users of New Event
 */
export async function notifyNewEvent(event, recipientEmails) {
    if (!recipientEmails || recipientEmails.length === 0) return;

    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #FF4757;">New Event Alert: ${event.name}! 🚀</h2>
            <p>A new event has just been published on VITPULSE.</p>
            
            <div style="border-left: 4px solid #FF4757; padding-left: 15px; margin: 20px 0;">
                <h3 style="margin: 0;">${event.name}</h3>
                <p style="color: #666; font-size: 14px;">${event.description || 'No description provided.'}</p>
                <p><strong>Date:</strong> ${new Date(event.start_time).toLocaleDateString()}</p>
                <p><strong>Venue:</strong> ${event.location}</p>
            </div>

            <a href="https://vitpulse.com/events" style="display: inline-block; padding: 12px 24px; background: #FF4757; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Register Now
            </a>

            <p style="font-size: 12px; color: #888; margin-top: 30px;">
                Don't miss out! Check the app for more details and branch restrictions.
            </p>
        </div>
    `;

    return sendEmail({
        to: recipientEmails,
        subject: `✨ New Event: ${event.name} is now LIVE!`,
        html
    });
}

/**
 * 3. Registration Deadline Reminder
 */
export async function sendRegistrationReminder(event, recipientEmails) {
     const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #FFD700;">Hurry! Registration Ending Soon ⏰</h2>
            <p>Registrations for <strong>${event.name}</strong> are closing shortly.</p>
            
            <p>Make sure you secure your spot before it's too late!</p>
            
            <div style="background: #FFF9E6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; font-weight: bold;">Ends: ${new Date(event.registration_end || event.start_time).toLocaleString()}</p>
            </div>

            <a href="https://vitpulse.com/events" style="display: inline-block; padding: 12px 24px; background: #333; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Go to Events
            </a>
        </div>
    `;

    return sendEmail({
        to: recipientEmails,
        subject: `⏰ Reminder: Registrations for ${event.name} are closing!`,
        html
    });
}
