import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | AI Content Factory',
  description: 'Privacy Policy for AI Content Factory by 프라이머리시스템',
};

export default function PrivacyPage() {
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
        <h1 className="text-2xl font-bold text-white">Privacy Policy</h1>
        <p className="mt-2 text-sm text-zinc-500">Last updated: March 2025</p>

        <div className="mt-8 space-y-6 text-sm text-zinc-400">
          <section>
            <h2 className="mb-2 font-medium text-white">Operator</h2>
            <p>
              This service is operated by <strong className="text-zinc-300">프라이머리시스템</strong>.
              Contact: <a href="mailto:yunjun2006best@gmail.com" className="text-zinc-300 underline hover:text-white">yunjun2006best@gmail.com</a>.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-medium text-white">Information we collect</h2>
            <p>
              We collect information you provide when signing in (e.g. via Google: email, name, profile picture),
              and usage data necessary to provide the service (e.g. projects, generated content, credit usage).
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-medium text-white">How we use it</h2>
            <p>
              Your information is used to operate the service, process your requests, manage your account and credits,
              and improve the product. We do not sell your personal data to third parties.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-medium text-white">Third-party services</h2>
            <p>
              We use Supabase (auth, database, storage), Google (sign-in), and may use payment providers (e.g. Lemon Squeezy)
              for purchases. Their respective privacy policies apply to data they process.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-medium text-white">Data retention and security</h2>
            <p>
              We retain your data for as long as your account is active or as needed to provide the service and comply with law.
              We take reasonable measures to protect your data; no system is completely secure.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-medium text-white">Contact</h2>
            <p>
              For privacy-related questions, contact us at{' '}
              <a href="mailto:yunjun2006best@gmail.com" className="text-zinc-300 underline hover:text-white">yunjun2006best@gmail.com</a>.
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
