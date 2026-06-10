-- SEED TEAM MEMBERS DATA (Optional)
-- Run this if the team section is empty after applying RLS fixes.

INSERT INTO public.team_members (name, designation, description, display_order)
VALUES 
('Shanmuka Manikanta', 'Lead Developer', 'Full-stack engineer passionate about building scalable campus solutions and smart event management systems.', 1),
('Alex Johnson', 'UI/UX Designer', 'Creative designer focused on crafting premium, neuromorphic interfaces and seamless user experiences.', 2),
('Sarah Chen', 'Backend Architect', 'Systems expert specializing in robust database schemas and high-performance server-side logic.', 3)
ON CONFLICT DO NOTHING;

-- If you have specific profiles you want to link, you can update them later via the Admin Panel.
