"use client";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] pt-32 pb-20 px-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Privacy Policy</h1>
                    <p className="text-gray-400">Last Updated: December 2024</p>
                </div>

                <div className="space-y-12 text-gray-300 leading-relaxed">
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
                        <p>
                            Welcome to the ReLU Club platform (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting your privacy and ensuring transparency about how we handle your data. This policy explains what information we collect from students of Amrita Vishwa Vidyapeetham and how we use it.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">2. Information We Collect</h2>
                        <div className="space-y-4">
                            <p>We collect only the information necessary to identify you as a student and manage your participation in club activities:</p>
                            <ul className="list-disc pl-6 space-y-2 text-gray-400">
                                <li><strong>Identity Data:</strong> Name, Roll Number, Class, Section.</li>
                                <li><strong>Contact Data:</strong> University Email Address (`@av.students.amrita.edu`) and Mobile Number.</li>
                                <li><strong>Activity Data:</strong> Events you register for, your team memberships, and your attendance records.</li>
                                <li><strong>Technical Data:</strong> IP address, browser type, and device information used to access our platform (for security purposes).</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Your Data</h2>
                        <ul className="list-disc pl-6 space-y-2 text-gray-400">
                            <li>To verify your status as a current student of the university.</li>
                            <li>To facilitate event registrations and team formations.</li>
                            <li>To generate certificates of participation.</li>
                            <li>To communicate important updates regarding events you have joined.</li>
                            <li>To maintain the internal records of the club as required by the university administration.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">4. Data Sharing & Disclosure</h2>
                        <p>
                            We <strong>never</strong> sell your personal data. We only share information in the following strict circumstances:
                        </p>
                        <ul className="list-disc pl-6 mt-4 space-y-2 text-gray-400">
                            <li><strong>University Administration:</strong> Attendance lists and participation records may be shared with faculty mentors or the college administration for academic credit or official record-keeping.</li>
                            <li><strong>Legal Requirements:</strong> If required by law or university disciplinary committees.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">5. Data Security</h2>
                        <p>
                            We employ industry-standard security measures, including Firebase Authentication restrictions and Firestore security rules, to protect your data. Only authorized Core Committee members (Admins) have access to sensitive user data.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">6. Your Rights</h2>
                        <p>
                            You have the right to request a copy of the data we hold about you or request corrections to your profile. You can update your profile details directly through the &quot;Profile&quot; section of the website.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">7. Contact Us</h2>
                        <p>
                            If you have any questions about this Privacy Policy, please contact us at:
                            <br />
                            <a href="mailto:reluclub@av.amrita.edu" className="text-blue-400 hover:text-blue-300 transition-colors">reluclub@av.amrita.edu</a>
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
