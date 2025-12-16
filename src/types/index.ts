export interface Event {
    id: string;
    title: string;
    date: string;
    description: string;
    fullDescription: string;
    details: string[];
    link?: string;
    image?: string;
    status: "upcoming" | "past"; // Display status
    registrationStatus: "upcoming" | "open" | "closed"; // Logic status
    isFeedbackOpen: boolean;
    attendanceCode?: string; // If set, attendance is active
    attendanceStatus?: 'upcoming' | 'active' | 'ended'; // Lifecycle
    feedbackStatus?: 'upcoming' | 'active' | 'ended'; // Lifecycle
    avgRating?: number;
    feedbackCount?: number;
    minTeamSize?: number; // Default 1
    maxTeamSize?: number; // Default 1
}

export interface TeamMember {
    id: string;
    name: string;
    role: string;
    image: string;
    links: {
        linkedin?: string;
        github?: string;
        mail?: string;
        scholar?: string;
    };
    category: "core" | "mentors";
}



export interface Resource {
    id: string;
    title: string;
    description: string;
    category: "AIML" | "DSA";
    type: "image" | "pdf" | "url";
    url: string; // The content URL (File or Link)
    thumbnailUrl?: string; // Required for 'url' type, optional for others
}


export interface GalleryImage {
    id: string;
    src: string;
    alt: string;
    eventId?: string;
    type?: 'image' | 'video'; // optional for backward compatibility, default 'image'
    category?: string;
    timestamp: any;
}

export interface AdminProfile {
    uid: string;
    email: string;
    role: "pending" | "President" | "VP_AIML" | "VP_DSA" | "CTO" | "AdminHead" | "PRHead" | "Treasurer" | "Mentor" | "Faculty" | "Activator" | "admin";
    status: "onboarding" | "active";
    createdAt: any;
    approvedAt?: any;
    displayName?: string;
    photoURL?: string | null;
    rollNo?: string;
    dob?: string;
    socials?: {
        linkedin?: string;
        instagram?: string;
        github?: string;
    };
}

export interface PendingRegistration {
    id: string;
    email: string;
    requestedAt: any;
}

export interface AuditLog {
    id: string;
    actorUid: string;
    actorName: string;
    action: string;
    details?: any;
    timestamp: any; // Firestore Timestamp
}

export interface UserProfile {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    rollNo?: string;
    class?: string; // e.g. "AIE", "CSE" - Configurable
    section?: string; // e.g. "A", "B" - Configurable
    hosteller?: boolean;
    mobile?: string;
    isVerified: boolean;
    createdAt: any;
}

export interface EventRegistration {
    id: string;
    eventId: string;
    userId: string;
    userDetails: {
        name: string;
        rollNo: string;
        class: string;
        section: string;
        mobile: string;
    };
    registeredAt: any;
    status: 'registered' | 'cancelled' | 'attended';
    feedbackSubmitted?: boolean;
    teamName?: string;
    teamMembers?: {
        name: string;
        rollNo: string;
        mobile?: string;
    }[];
}

export interface Feedback {
    id: string;
    eventId: string;
    userId: string;
    userName: string;
    overallRating: number; // 5 stars
    matrixRatings: {
        content: number;
        activities: number;
        interaction: number;
        organization: number;
        enjoyment: number;
        knowledgeable: number;
    };
    opinion: string;
    submittedAt: any;
}

export interface ContactMessage {
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    timestamp: any;
}
