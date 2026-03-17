// Mock data for VIT-PULSE restructuring
export const mockUsers = [];
export const mockEvents = [
    {
        id: 'evt_001',
        name: 'Technical Symposium 2026',
        participation_type: 'TEAM',
        sector_lock: 'CSE/IT',
        location: 'Main Auditorium',
        status: 'ACTIVE',
        registration_start: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        registration_end: new Date(Date.now() + 86400000).toISOString(),   // Tomorrow
        event_date: '2026-04-20',
        access_protocol: 'FREE',
        description: 'Annual technical symposium for engineering students.',
        is_live: true
    },
    {
        id: 'evt_002',
        name: 'Workshop on AI/ML',
        participation_type: 'SOLO',
        sector_lock: 'ALL',
        location: 'Lab 4, Block B',
        status: 'UPCOMING',
        registration_start: new Date(Date.now() + 3600000).toISOString(),   // In 1 hour
        registration_end: new Date(Date.now() + 172800000).toISOString(),  // In 2 days
        event_date: '2026-05-15',
        access_protocol: 'PAID',
        description: 'Hands-on workshop on Advanced Machine Learning.',
        is_live: false
    }
];
export const mockParticipants = [];
export const mockTickets = [];
export const mockAttendanceLogs = [];
export const mockAttendanceTrend = [];
export const mockCheckinTimeline = [];
export const mockStats = [];
