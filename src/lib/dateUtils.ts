// Registrations close at the start of the event day (i.e. after 11:59 PM the day before).
// eventDateStr is "YYYY-MM-DD".
export function isRegistrationWindowOpen(eventDateStr: string): boolean {
    if (!eventDateStr) return false;
    return new Date() < new Date(eventDateStr);
}
