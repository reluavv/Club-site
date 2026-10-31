"use client";

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] pt-32 pb-20 px-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Terms of Service</h1>
                    <p className="text-gray-400">Last Updated: December 2024</p>
                </div>

                <div className="space-y-12 text-gray-300 leading-relaxed">
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
                        <p>
                            By accessing or using the ReLU Club platform, you verify that you are a current student of Amrita Vishwa Vidyapeetham and agree to be bound by these Terms of Service. If you do not agree, strictly do not use this platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">2. Code of Conduct</h2>
                        <p>
                            As a member of this academic community, you agree to:
                        </p>
                        <ul className="list-disc pl-6 mt-4 space-y-2 text-gray-400">
                            <li>Provide accurate and truthful information during registration.</li>
                            <li>Maintain the dignity and reputation of the club and the university.</li>
                            <li>Not engage in any form of harassment, hate speech, or disruptive behavior on our platforms (including feedback forms).</li>
                            <li>Not attempt to hack, scrape, or disrupt the technical infrastructure of this website.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">3. Event Participation</h2>
                        <div className="space-y-4">
                            <p><strong>Registration:</strong> Registering for an event is a commitment to attend. Repeated &quot;No-Shows&quot; without prior cancellation may result in being blacklisted from future high-demand workshops.</p>
                            <p><strong>Teams:</strong> When registering as a team, the Team Leader is responsible for the consent and accuracy of all team members&apos; details.</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">4. Account Termination</h2>
                        <p>
                            We reserve the right to suspend or terminate your account if you violate these Terms, specifically:
                        </p>
                        <ul className="list-disc pl-6 mt-4 space-y-2 text-gray-400">
                            <li>Using false identity information.</li>
                            <li>Attempting to bypass security controls (e.g., SQL injection, XSS).</li>
                            <li>Violating university disciplinary policies.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">5. Intellectual Property</h2>
                        <p>
                            The content, logo, and code of the ReLU platform are the intellectual property of the ReLU Tech Team. You may not copy, reproduce, or distribute our assets without explicit permission.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">6. Limitation of Liability</h2>
                        <p>
                            This platform is provided &quot;as is.&quot; While we strive for perfection, we are not liable for any data loss, service interruption, or errors in event details. Always check official university channels for critical announcements.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">7. Changes to Terms</h2>
                        <p>
                            We may update these terms periodically to reflect changes in our operations or university policies. Continued use of the platform after updates constitutes acceptance of the new terms.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
