export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-black text-slate-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-16">
        <header className="flex flex-col gap-2">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Smart Admission Guide</p>
          <h1 className="text-3xl font-semibold sm:text-4xl">Auth testing sandbox</h1>
          <p className="max-w-2xl text-slate-300">
            Use these quick links to try signup, login, password reset, and logout against the
            API you just configured.
          </p>
        </header>

        <div className="grid gap-6 sm:grid-cols-2">
          <Card
            title="Signup / Login"
            description="Test account creation and login; token is stored locally so you can logout."
            href="/auth"
          />
          <Card
            title="Forgot password"
            description="Send a reset link email using your configured SMTP credentials."
            href="/auth/forgot-password"
          />
          <Card
            title="Reset password"
            description="Paste the token from the reset email to set a new password."
            href="/auth/reset-password"
          />
          <Card
            title="API reference"
            description="Review the authentication setup guide and SQL schema we generated."
            href="/AUTHENTICATION_SETUP.md"
            target="_blank"
          />
        </div>

        <footer className="text-sm text-slate-400">
          Tip: you can inspect network requests in the browser devtools to verify payloads and responses.
        </footer>
      </div>
    </div>
  );
}

function Card({ title, description, href, target }) {
  return (
    <a
      href={href}
      target={target}
      rel={target === "_blank" ? "noreferrer" : undefined}
      className="group rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-lg ring-1 ring-slate-800/60 transition hover:-translate-y-1 hover:border-slate-700 hover:ring-slate-700/80"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-lg font-semibold text-white">{title}</div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-wide text-slate-200">
          Open
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-300">{description}</p>
    </a>
  );
}
