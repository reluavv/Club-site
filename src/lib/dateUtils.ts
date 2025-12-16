
export function isRegistrationWindowOpen(eventDateStr: string): boolean {
    // Event Date Format: "YYYY-MM-DD"
    if (!eventDateStr) return false;

    // Parse event date (at 00:00:00)
    const eventDate = new Date(eventDateStr);

    // Deadline: 11:59 PM on the day BEFORE the event
    // So if event is 2025-10-10, deadline is 2025-10-09 23:59:59
    // Basically, any time BEFORE 2025-10-10 00:00:00 is acceptable?
    // Requirement: "Automatically close registrations at 11:59 PM on the day before the event."
    // This implies that on the day of the event (00:00 onwards), it is closed.

    const now = new Date();

    // Simple check: Is now < eventDate (start of day)?
    // If today is 10th and event is 10th, now (10th 10am) >= eventDate (10th 00am) -> Closed.
    // If today is 9th 11:59pm -> Open.

    return now < eventDate;
}
