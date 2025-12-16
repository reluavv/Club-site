import { Metadata } from 'next';
import EventsClient from './EventsClient';
import { getEvents } from '@/lib/api';

export const metadata: Metadata = {
    title: 'Events | ReLU - AI&ML Student Club',
    description: 'Stay updated with the latest events, workshops, and news from the ReLU AI/ML Club.',
};

export default async function EventsPage() {
    const events = await getEvents();
    return <EventsClient events={events} />;
}
