import { Metadata } from 'next';
import AboutClient from './AboutClient';
import { getAllAdmins } from '@/lib/api';

export const metadata: Metadata = {
    title: 'Team & About | ReLU',
    description: 'Meet the team behind ReLU - The refining logic and unleashing AI student club.',
};

export default async function AboutPage() {
    const allAdmins = await getAllAdmins();
    // Filter for active users only
    const activeTeam = allAdmins.filter(u => u.status === "active");
    return <AboutClient team={activeTeam} />;
}
