// Page-enter animation in plain CSS, so server-rendered pages are visible before JavaScript loads.
// Turned off for users who prefer reduced motion (see globals.css).
export default function Template({ children }: { children: React.ReactNode }) {
    return <div className="animate-[slideUp_0.5s_ease-out]">{children}</div>;
}
