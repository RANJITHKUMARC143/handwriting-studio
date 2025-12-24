import React from 'react';
import Link from 'next/link';
import { FileText } from 'lucide-react';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="border-b border-neutral-200 bg-white sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 ring-2 ring-primary/5">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight text-black leading-none">Handwriting Studio</h1>
                            <p className="text-[10px] text-muted-foreground font-medium tracking-wide uppercase leading-none mt-0.5">AI Document Generator</p>
                        </div>
                    </Link>
                    <Link href="/" className="text-sm text-neutral-600 hover:text-black">
                        ← Back to Home
                    </Link>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-6 py-12">
                <h1 className="text-4xl font-bold text-black mb-2">Privacy Policy</h1>
                <p className="text-sm text-neutral-500 mb-8">Last updated: December 24, 2024</p>

                <div className="prose prose-neutral max-w-none space-y-8">
                    <section>
                        <h2 className="text-2xl font-bold text-black mb-4">1. Introduction</h2>
                        <p className="text-neutral-700 leading-relaxed">
                            Curiospry Technologies Private Limited ("we," "our," or "us") operates the Handwriting Studio application.
                            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-black mb-4">2. Information We Collect</h2>

                        <h3 className="text-xl font-semibold text-black mb-3">2.1 Information You Provide</h3>
                        <ul className="list-disc pl-6 space-y-2 text-neutral-700">
                            <li>Text content you upload or input for conversion</li>
                            <li>Document files (PDF, DOCX, TXT) you upload</li>
                            <li>Customization settings and preferences</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-black mb-3 mt-4">2.2 Automatically Collected Information</h3>
                        <ul className="list-disc pl-6 space-y-2 text-neutral-700">
                            <li>Usage data and analytics</li>
                            <li>Device information and browser type</li>
                            <li>IP address and location data</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-black mb-4">3. How We Use Your Information</h2>
                        <p className="text-neutral-700 leading-relaxed mb-3">We use the collected information to:</p>
                        <ul className="list-disc pl-6 space-y-2 text-neutral-700">
                            <li>Provide and maintain our service</li>
                            <li>Process your text-to-handwriting conversions</li>
                            <li>Improve and optimize our application</li>
                            <li>Communicate with you about service updates</li>
                            <li>Ensure security and prevent fraud</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-black mb-4">4. Data Storage and Retention</h2>
                        <p className="text-neutral-700 leading-relaxed">
                            All uploaded documents and generated PDFs are automatically deleted after 30 minutes.
                            We use Supabase for secure cloud storage with encryption at rest and in transit.
                            Your data is stored on servers located in secure data centers.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-black mb-4">5. Data Security</h2>
                        <p className="text-neutral-700 leading-relaxed">
                            We implement industry-standard security measures including:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-neutral-700 mt-3">
                            <li>SSL/TLS encryption for data transmission</li>
                            <li>Encrypted storage for all files</li>
                            <li>Regular security audits and updates</li>
                            <li>Automatic data deletion after 30 minutes</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-black mb-4">6. Third-Party Services</h2>
                        <p className="text-neutral-700 leading-relaxed mb-3">We use the following third-party services:</p>
                        <ul className="list-disc pl-6 space-y-2 text-neutral-700">
                            <li><strong>Supabase:</strong> Database and file storage</li>
                            <li><strong>Vercel:</strong> Application hosting</li>
                            <li><strong>Google Fonts:</strong> Font delivery</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-black mb-4">7. Your Rights</h2>
                        <p className="text-neutral-700 leading-relaxed mb-3">You have the right to:</p>
                        <ul className="list-disc pl-6 space-y-2 text-neutral-700">
                            <li>Access your personal data</li>
                            <li>Request deletion of your data</li>
                            <li>Opt-out of data collection</li>
                            <li>Request data portability</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-black mb-4">8. Children's Privacy</h2>
                        <p className="text-neutral-700 leading-relaxed">
                            Our service is not intended for children under 13 years of age.
                            We do not knowingly collect personal information from children under 13.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-black mb-4">9. Changes to This Policy</h2>
                        <p className="text-neutral-700 leading-relaxed">
                            We may update this Privacy Policy from time to time. We will notify you of any changes
                            by posting the new Privacy Policy on this page and updating the "Last updated" date.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-black mb-4">10. Contact Us</h2>
                        <div className="bg-slate-50 rounded-xl p-6 border border-neutral-200">
                            <p className="font-semibold text-black mb-3">Curiospry Technologies Private Limited</p>
                            <div className="space-y-2 text-neutral-700">
                                <p><strong>Email:</strong> <a href="mailto:support@curiospry.com" className="text-black hover:underline">support@curiospry.com</a></p>
                                <p><strong>Website:</strong> <a href="https://curiospry.com" target="_blank" rel="noopener noreferrer" className="text-black hover:underline">curiospry.com</a></p>
                                <p><strong>Address:</strong> India</p>
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-neutral-200 mt-16">
                <div className="max-w-4xl mx-auto px-6 py-6">
                    <p className="text-xs text-neutral-500 text-center">
                        © {new Date().getFullYear()} Curiospry Technologies Private Limited. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
