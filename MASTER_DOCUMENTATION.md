# RELU Platform - Official Documentation
**Version 1.0 (December 2024)**  
**Author:** RELU Tech Team  
**Amrita Vishwa Vidyapeetham**

---

# 1. Introduction

## 1.1 What is ReLU?
**RELU (Refining Logic and Unleashing AI)** is a premier student club at Amrita Vishwa Vidyapeetham dedicated to fostering excellence in Artificial Intelligence (AI), Machine Learning (ML), and Data Structures & Algorithms (DSA). The club serves as a bridge between academic theory and practical industry application.

## 1.2 Purpose of this Platform
This web application is the centralized digital hub for the RELU club. It replaces scattered Google Forms, WhatsApp groups, and manual spreadsheets with a unified, automated ecosystem.

**Key Objectives:**
1.  **Centralized Identity:** A single portal for student profiles, event history, and resources.
2.  **Data Sovereignty:** Owning our data (registrations, attendance, feedback) on our own Firestore database rather than relying on third-party tools.
3.  **Professionalism:** Providing a seamless, high-tech experience that reflects the club's technical standards.

---

# 2. Key Features

## 2.1 For Students (Public Portal)
*   **Secure Authentication:** Sign-up is strictly restricted to `@av.students.amrita.edu` email addresses, ensuring only verified students can join.
*   **Unified Profile:** A "Digital ID Card" that tracks Name, Roll Number, Class, and Mobile. Once filled, it auto-populates for all future events.
*   **Event Registration:**
    *   **Instant One-Click:** Register for individual events in seconds.
    *   **Team Support:** Seamlessly create and register teams for hackathons without invite codes.
*   **Resource Library:** Access curated study materials for AI/ML and DSA (PDFs, Links, Videos) filterable by domain.
*   **Gallery:** A visual timeline of past events and workshops.
*   **Certificates (Planned):** Future capability to download participation certificates directly.

## 2.2 For Administrators (Admin Console)
*   **Dashboard Analytics:** Real-time visibility into Total Users, Recent Registrations, and Club Growth.
*   **Event Management:** Full CRUD (Create, Read, Update, Delete) capabilities for events.
    *   Set **Registration Status** (Open/Closed).
    *   Define **Team Sizes** (Min/Max).
    *   Enable **Feedback** collection.
*   **"Doomsday" Console:** A high-level system manager for CTOs to manage database collections and critical system operations.
*   **User Management:**
    *   **Role Hierarchy:** Define roles from Activator up to President/CTO.
    *   **Tenure Tracking:** Automated tracking of admin active years (2-year tenure policy).
*   **Communication:** A dedicated Inbox to view and manage inquiries from the public "Contact Us" form.

---

# 3. System Architecture

## 3.1 Technology Stack
*   **Frontend:** [Next.js 14](https://nextjs.org/) (App Router) - For server-side rendering and high performance.
*   **Language:** [TypeScript](https://www.typescriptlang.org/) - Ensuring type safety and code reliability.
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) - For a modern, responsive, "Cybernetic" aesthetic.
*   **Backend / Database:** [Firebase](https://firebase.google.com/)
    *   **Authentication:** Identity management.
    *   **Firestore:** NoSQL real-time database.
    *   **Storage:** Hosting for event posters and resource files.

## 3.2 Directory Structure
The codebase follows a modular architecture designed for scalability:

```
src/
├── app/                 # Next.js App Router (Page Logic)
│   ├── (public)/        # Public-facing routes (Home, About, Events)
│   └── admin/           # Secured Admin routes (Guarded by middleware)
├── components/          # Reusable UI Elements
│   ├── ui/              # Buttons, Inputs, Cards
│   ├── layout/          # Navbar, Footer, Sidebar
│   └── public/admin/    # Context-specific components
├── services/            # Business Logic & API Calls (The "Brain")
│   ├── events.ts        # Event operations
│   ├── registrations.ts # Registration logic
│   └── users.ts         # User profile management
├── lib/                 # Utilities (Auth state, Constants)
└── types/               # TypeScript Definitions (Data Models)
```

---

# 4. Core Processes & Logic

## 4.1 The "Team Registration" Algorithm
To simplify the user experience for hackathons, we implemented a **Leader-Centric** registration model.
*   **Logic:** A Team Leader registers on behalf of the team.
*   **Validation:** The system scans **ALL** existing registrations for that specific event. If *any* member (Leader or Teammate) is found to be already registered in another team, the request is rejected.
*   **Result:** Prevents duplicate participation while removing the friction of "Invite Codes".

## 4.2 The "Doomsday" Protocol
The `Doomsday` console is a specialized interface for the CTO and System Admins. It allows for direct manipulation of critical collections (`admins`, `users`, `events`). It serves as a failsafe to fix data anomalies without needing direct database console access.

## 4.3 Feedback Loop
1.  **Event Completion:** Admin marks an event as "Past" and enables Feedback.
2.  **User Access:** Participants see a "Give Feedback" button on their "My Events" page.
3.  **Calculation:** Ratings are aggregated in real-time.
    *   `New Average = ((Current * Count) + New Rating) / (Count + 1)`
4.  **Incentive:** Feedback submission can be linked to certificate generation.

---

# 5. Security Measures

## 5.1 Role-Based Access Control (RBAC)
*   **Public:** Access to landing pages only.
*   **Authenticated User:** Access to Profile, Registration.
*   **Admin:** Access to Dashboard.
    *   *Note:* The `AdminGuard` component wraps all `/admin` routes, checking the user's custom claim or Firestore profile before rendering.

## 5.2 Domain Restriction
*   Sign-ups are strictly enforced to `@av.students.amrita.edu`.
*   This prevents unauthorized external access and spammers.

---

# 6. Future Roadmap

## 6.1 Planned Improvements
*   **QR Code Attendance:** Admins scan user QR codes generated on the Profile page for instant attendance marking.
*   **Automated Certificates:** Generate PDF certificates upon verifying "Attended" status + Feedback submission.
*   **Alumni Network:** A specialized portal for graduated members to stay connected.

## 6.2 Maintenance
*   **Legacy Cleanup:** The system is designed to auto-archive logs older than 30 days to save storage costs.
*   **Tenure Automatic:** Admin profiles are flagged for removal after 2 years to ensure the team stays fresh.

---

# 7. Conclusion
The RELU Platform is more than a website; it is an operational standard. By creating a custom solution, we demonstrate the very core values of our club: **Refining Logic** to build better systems and **Unleashing AI** (and technology) to solve real-world problems.

This documentation serves as the single source of truth for all future developers and maintainers of the RELU legacy.
