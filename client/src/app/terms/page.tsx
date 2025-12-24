import React from 'react';
import Link from 'next/link';
import { FileText } from 'lucide-react';

export default function TermsPage() {
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
                <h1 className="text-4xl font-bold text-black mb-2">Terms of Service</h1>
                <p className="text-sm text-neutral-500 mb-8">Last updated: December 24, 2024</p>

                <div className="prose prose-neutral max-w-none space-y-8">
                    <section>
                        <h2 className="text-2xl font-bold text-black mb-4">1. Acceptance of Terms</h2>
                        <p className="text-neutral-700 leading-relaxed">
                            By accessing and using Handwriting Studio ("the Service"), operated by Curiospry Technologies Private Limited,
                            you accept and agree to be bound by these Terms of Service. If you do not agree to these terms,
                            please do not use the Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-black mb-4">2. Description of Service</h2>
                        <p className="text-neutral-700 leading-relaxed">
                            Handwriting Studio is a web-based application that converts digital text into handwritten-style PDFs.
                            The Service allows users to:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-neutral-700 mt-3">
                            <li>Upload text files (PDF, DOCX, TXT)</li>
                            <li>Customize handwriting styles, fonts, and paper settings</li>
                            <li>Generate and download handwritten-style PDF documents</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-black mb-4">3. User Responsibilities</h2>

                        <h3 className="text-xl font-semibold text-black mb-3">3.1 Acceptable Use</h3>
                        <p className="text-neutral-700 leading-relaxed mb-3">You agree to use the Service only for lawful purposes. You must not:</p>
                        <ul className="list-disc pl-6 space-y-2 text-neutral-700">
                            <li>Upload content that infringes on intellectual property rights</li>
                            <li>Use the Service to create fraudulent or deceptive documents</li>
                            <li>Attempt to reverse engineer or compromise the Service</li>
                            <li>Upload malicious code, viruses, or harmful content</li>
                            <li>Use the Service for any illegal or unauthorized purpose</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-black mb-3 mt-4">3.2 Content Ownership</h3>
                        <p className="text-neutral-700 leading-relaxed">
                            You retain all rights to the content you upload. By using the Service, you grant us a temporary license
                            to process your content solely for the purpose of providing the Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-black mb-4">4. Data and Privacy</h2>
                        <p className="text-neutral-700 leading-relaxed">
                            All uploaded documents and generated PDFs are automatically deleted after 30 minutes.
                            We do not permanently store your content. For more information, please review our{' '}
                            <Link href="/privacy" className="text-black font-semibold hover:underline">Privacy Policy</Link>.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-black mb-4">5. Service Availability</h2>
                        <p className="text-neutral-700 leading-relaxed">
                            We strive to provide reliable service but do not guarantee uninterrupted access.
                            The Service may be temporarily unavailable due to:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-neutral-700 mt-3">
                            <li>Scheduled maintenance</li>
                            <li>Technical issues or outages</li>
                            <li>Force majeure events</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-black mb-4">6. Intellectual Property</h2>
                        <p className="text-neutral-700 leading-relaxed">
                            The Service, including its design, features, and functionality, is owned by Curiospry Technologies Private Limited
                            and is protected by copyright, trademark, and other intellectual property laws.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-black mb-4">7. Disclaimer of Warranties</h2>
                        <p className="text-neutral-700 leading-relaxed">
                            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
                            We do not warrant that:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-neutral-700 mt-3">
                            <li>The Service will be error-free or uninterrupted</li>
                            <li>Generated PDFs will be identical to human handwriting</li>
                            <li>The Service will meet your specific requirements</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-black mb-4">8. Limitation of Liability</h2>
                        <p className="text-neutral-700 leading-relaxed">
                            To the maximum extent permitted by law, Curiospry Technologies Private Limited shall not be liable for any
                            indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-black mb-4">9. Termination</h2>
                        <p className="text-neutral-700 leading-relaxed">
                            We reserve the right to suspend or terminate your access to the Service at any time,
                            with or without notice, for any violation of these Terms or for any other reason.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-black mb-4">10. Changes to Terms</h2>
                        <p className="text-neutral-700 leading-relaxed">
                            We may modify these Terms at any time. Continued use of the Service after changes constitutes
                            acceptance of the modified Terms. We will notify users of significant changes.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-black mb-4">11. Governing Law</h2>
                        <p className="text-neutral-700 leading-relaxed">
                            These Terms shall be governed by and construed in accordance with the laws of India,
                            without regard to its conflict of law provisions.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-black mb-4">12. Contact Information</h2>
                        <div className="bg-slate-50 rounded-xl p-6 border border-neutral-200">
                            <p className="font-semibold text-black mb-3">Curiospry Technologies Private Limited</p>
                            <div className="space-y-2 text-neutral-700">
                                <p><strong>Email:</strong> <a href="mailto:support@curiospry.com" className="text-black hover:underline">support@curiospry.com</a></p>
                                <p><strong>Website:</strong> <a href="https://curiospry.com" target="_blank" rel="noopener noreferrer" className="text-black hover:underline">curiospry.com</a></p>
                                <p><strong>Address:</strong> India</p>
                            </div>
                            <p className="text-sm text-neutral-600 mt-4">
                                For questions or concerns about these Terms, please contact us at the above email address.
                            </p>
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
