// Mock data for Gate Pulse demo mode
export const mockUsers = [
    { id: 'admin-001', email: 'admin@gatepulse.com', full_name: 'Alex Morgan', role: 'admin', avatar: null },
    { id: 'staff-001', email: 'staff@gatepulse.com', full_name: 'Jordan Lee', role: 'staff', avatar: null },
    { id: 'user-001', email: 'participant@gatepulse.com', full_name: 'Sam Rivera', role: 'participant', avatar: null },
    { id: 'user-002', email: 'jane@example.com', full_name: 'Jane Cooper', role: 'participant', avatar: null },
    { id: 'user-003', email: 'mike@example.com', full_name: 'Mike Chen', role: 'participant', avatar: null },
    { id: 'user-004', email: 'sara@example.com', full_name: 'Sara Johnson', role: 'participant', avatar: null },
    { id: 'user-005', email: 'raj@example.com', full_name: 'Raj Patel', role: 'participant', avatar: null },
];

export const mockEvents = [
    {
        id: 'evt-001',
        name: 'Tech Innovation Summit 2026',
        description: 'Annual technology innovation summit featuring keynote speakers, workshops, and networking sessions on AI, blockchain, and cloud computing.',
        location: 'Convention Center, Hall A',
        start_time: '2026-03-15T09:00:00',
        end_time: '2026-03-15T18:00:00',
        created_by: 'admin-001',
        status: 'active',
        image: null,
        max_capacity: 500,
        registered_count: 234,
        checked_in_count: 187,
    },
    {
        id: 'evt-002',
        name: 'Design Systems Workshop',
        description: 'Hands-on workshop covering modern design system creation, component libraries, and design tokens for scalable frontend development.',
        location: 'Innovation Lab, Room 201',
        start_time: '2026-03-20T10:00:00',
        end_time: '2026-03-20T16:00:00',
        created_by: 'admin-001',
        status: 'active',
        image: null,
        max_capacity: 100,
        registered_count: 89,
        checked_in_count: 72,
    },
    {
        id: 'evt-003',
        name: 'Cybersecurity Conference',
        description: 'Deep dive into the latest cybersecurity threats, defense strategies, and emerging security technologies.',
        location: 'Auditorium B, Main Campus',
        start_time: '2026-04-01T09:30:00',
        end_time: '2026-04-01T17:30:00',
        created_by: 'admin-001',
        status: 'upcoming',
        image: null,
        max_capacity: 300,
        registered_count: 156,
        checked_in_count: 0,
    },
    {
        id: 'evt-004',
        name: 'Startup Pitch Night',
        description: 'An exciting evening where emerging startups pitch their ideas to investors and industry experts.',
        location: 'The Grand Hall',
        start_time: '2026-04-10T18:00:00',
        end_time: '2026-04-10T22:00:00',
        created_by: 'admin-001',
        status: 'upcoming',
        image: null,
        max_capacity: 200,
        registered_count: 78,
        checked_in_count: 0,
    },
    {
        id: 'evt-005',
        name: 'Cloud Computing Bootcamp',
        description: 'Intensive 1-day bootcamp covering AWS, Azure, and GCP fundamentals with hands-on labs.',
        location: 'Training Center, Floor 3',
        start_time: '2026-02-28T08:00:00',
        end_time: '2026-02-28T17:00:00',
        created_by: 'admin-001',
        status: 'completed',
        image: null,
        max_capacity: 80,
        registered_count: 75,
        checked_in_count: 68,
    },
];

export const mockParticipants = [
    { id: 'p-001', user_id: 'user-001', event_id: 'evt-001', ticket_id: 'tkt-001', registration_status: 'confirmed', created_at: '2026-03-01T10:00:00', user: mockUsers[2] },
    { id: 'p-002', user_id: 'user-002', event_id: 'evt-001', ticket_id: 'tkt-002', registration_status: 'confirmed', created_at: '2026-03-02T11:00:00', user: mockUsers[3] },
    { id: 'p-003', user_id: 'user-003', event_id: 'evt-001', ticket_id: 'tkt-003', registration_status: 'confirmed', created_at: '2026-03-03T09:00:00', user: mockUsers[4] },
    { id: 'p-004', user_id: 'user-004', event_id: 'evt-002', ticket_id: 'tkt-004', registration_status: 'confirmed', created_at: '2026-03-05T14:00:00', user: mockUsers[5] },
    { id: 'p-005', user_id: 'user-005', event_id: 'evt-002', ticket_id: 'tkt-005', registration_status: 'confirmed', created_at: '2026-03-06T08:00:00', user: mockUsers[6] },
    { id: 'p-006', user_id: 'user-001', event_id: 'evt-003', ticket_id: 'tkt-006', registration_status: 'confirmed', created_at: '2026-03-10T12:00:00', user: mockUsers[2] },
];

export const mockTickets = [
    { id: 'tkt-001', participant_id: 'p-001', event_id: 'evt-001', qr_token: 'GP-TKT-001-A7F3B9E2', is_validated: true, validated_at: '2026-03-15T09:15:00', validated_by: 'staff-001', event: mockEvents[0], participant: mockParticipants[0] },
    { id: 'tkt-002', participant_id: 'p-002', event_id: 'evt-001', qr_token: 'GP-TKT-002-C4D8E1F6', is_validated: true, validated_at: '2026-03-15T09:22:00', validated_by: 'staff-001', event: mockEvents[0], participant: mockParticipants[1] },
    { id: 'tkt-003', participant_id: 'p-003', event_id: 'evt-001', qr_token: 'GP-TKT-003-B2A5C7D9', is_validated: false, validated_at: null, validated_by: null, event: mockEvents[0], participant: mockParticipants[2] },
    { id: 'tkt-004', participant_id: 'p-004', event_id: 'evt-002', qr_token: 'GP-TKT-004-E8F1A3B5', is_validated: true, validated_at: '2026-03-20T10:05:00', validated_by: 'staff-001', event: mockEvents[1], participant: mockParticipants[3] },
    { id: 'tkt-005', participant_id: 'p-005', event_id: 'evt-002', qr_token: 'GP-TKT-005-D6C9E2F4', is_validated: false, validated_at: null, validated_by: null, event: mockEvents[1], participant: mockParticipants[4] },
    { id: 'tkt-006', participant_id: 'p-006', event_id: 'evt-003', qr_token: 'GP-TKT-006-A1B3C5D7', is_validated: false, validated_at: null, validated_by: null, event: mockEvents[2], participant: mockParticipants[5] },
];

export const mockAttendanceLogs = [
    { id: 'log-001', ticket_id: 'tkt-001', timestamp: '2026-03-15T09:15:00', verification_status: 'success', event_id: 'evt-001' },
    { id: 'log-002', ticket_id: 'tkt-002', timestamp: '2026-03-15T09:22:00', verification_status: 'success', event_id: 'evt-001' },
    { id: 'log-003', ticket_id: 'tkt-001', timestamp: '2026-03-15T09:45:00', verification_status: 'duplicate', event_id: 'evt-001' },
    { id: 'log-004', ticket_id: 'tkt-004', timestamp: '2026-03-20T10:05:00', verification_status: 'success', event_id: 'evt-002' },
];

// Analytics chartdata
export const mockAttendanceTrend = [
    { date: 'Mon', registrations: 45, checkins: 38 },
    { date: 'Tue', registrations: 52, checkins: 44 },
    { date: 'Wed', registrations: 38, checkins: 31 },
    { date: 'Thu', registrations: 65, checkins: 58 },
    { date: 'Fri', registrations: 78, checkins: 69 },
    { date: 'Sat', registrations: 92, checkins: 84 },
    { date: 'Sun', registrations: 55, checkins: 47 },
];

export const mockCheckinTimeline = [
    { hour: '8 AM', count: 12 },
    { hour: '9 AM', count: 45 },
    { hour: '10 AM', count: 78 },
    { hour: '11 AM', count: 34 },
    { hour: '12 PM', count: 23 },
    { hour: '1 PM', count: 18 },
    { hour: '2 PM', count: 29 },
    { hour: '3 PM', count: 42 },
    { hour: '4 PM', count: 15 },
    { hour: '5 PM', count: 8 },
];

// Added missing mockStats for Dashboard and Analytics
export const mockStats = [
    { name: '08:00', attendees: 120, registrations: 150 },
    { name: '10:00', attendees: 340, registrations: 380 },
    { name: '12:00', attendees: 450, registrations: 480 },
    { name: '14:00', attendees: 380, registrations: 500 },
    { name: '16:00', attendees: 520, registrations: 550 },
    { name: '18:00', attendees: 480, registrations: 600 },
    { name: '20:00', attendees: 200, registrations: 610 },
];
