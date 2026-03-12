import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service | AI Content Factory',
  description: 'Terms of Service for AI Content Factory by 프라이머리시스템',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
          <Link href="/" className="text-lg font-semibold text-white hover:underline">
            AI Content Factory
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-bold text-white">Terms of Service</h1>
        <p className="mt-2 text-sm text-zinc-500">Last updated: March 2025</p>

        <div className="mt-8 space-y-6 text-sm text-zinc-400">
          <section>
            <h2 className="mb-2 font-medium text-white">Service overview</h2>
            <p>
              AI Content Factory is a service operated by <strong className="text-zinc-300">프라이머리시스템</strong> that
              helps you create short-form videos using AI-generated scripts, images, and voice. By using the service,
              you agree to these terms.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-medium text-white">Your responsibilities</h2>
            <p>
              You must provide accurate account information and keep your account secure. You are responsible for
              how you use the service and for any content you create or publish using it.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-medium text-white">Acceptable use</h2>
            <p>
              You may not use the service for illegal purposes, to infringe others’ rights, to distribute harmful or
              abusive content, or to abuse or overload our systems. We may suspend or terminate access for violations.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-medium text-white">Payments and credits</h2>
            <p>
              Use of the service may consume credits. Credits may be provided as a trial or purchased. Future billing,
              refund, and credit policies may apply and will be communicated where relevant (e.g. at purchase).
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-medium text-white">Account and termination</h2>
            <p>
              We may suspend or terminate your account if you breach these terms or for operational or legal reasons.
              You may stop using the service at any time. Termination does not entitle you to a refund unless otherwise stated.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-medium text-white">Limitation of liability</h2>
            <p>
              The service is provided “as is.” To the extent permitted by law, 프라이머리시스템 is not liable for
              indirect, incidental, or consequential damages, or for loss of data or profits arising from your use of the service.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-medium text-white">Contact</h2>
            <p>
              Questions about these terms: <a href="mailto:yunjun2006best@gmail.com" className="text-zinc-300 underline hover:text-white">yunjun2006best@gmail.com</a>.
            </p>
          </section>
        </div>

        <p className="mt-10">
          <Link href="/" className="text-sm text-zinc-500 hover:text-white">← Back to home</Link>
        </p>
      </main>
    </div>
  );
}
