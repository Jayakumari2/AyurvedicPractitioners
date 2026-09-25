import { useState } from 'react'
import type { FormEvent } from 'react'
import Dashboard from './Dashboard'

const features = [
  'Patient registration and secure login',
  'Practitioner profile management',
  'Availability scheduling and appointment booking',
  'Consultation records and treatment notes',
  'Admin verification and oversight',
]

const roles = [
  { name: 'Patients', description: 'Browse verified practitioners, book consultations, and review records.' },
  { name: 'Practitioners', description: 'Create profiles, manage availability, and record patient care plans.' },
  { name: 'Admins', description: 'Verify practitioners, review users, and monitor appointments.' },
]

type SessionUser = {
  fullName: string
  role: 'PATIENT' | 'PRACTITIONER'
}

function App() {
  const [session, setSession] = useState<SessionUser | null>(() => {
    const storedUser = localStorage.getItem('ayurvediccare_user')
    return storedUser ? JSON.parse(storedUser) as SessionUser : null
  })
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null)
  const [role, setRole] = useState<'PATIENT' | 'PRACTITIONER'>('PATIENT')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const openAuth = (mode: 'login' | 'register', selectedRole?: 'PATIENT' | 'PRACTITIONER') => {
    setAuthMode(mode)
    setRole(selectedRole ?? 'PATIENT')
    setMessage('')
  }

  const submitAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setMessage('')

    const payload = authMode === 'login'
      ? { email, password }
      : { email, password, fullName, role }

    try {
      const response = await fetch(`http://localhost:8080/api/auth/${authMode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.message ?? 'Authentication failed. Please check your details.')
      }

      localStorage.setItem('ayurvediccare_token', data.token)
      localStorage.setItem('ayurvediccare_user', JSON.stringify({ fullName: data.fullName, role: data.role }))
      setSession({ fullName: data.fullName, role: data.role })
      setAuthMode(null)
      setEmail('')
      setPassword('')
      setFullName('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to connect to the backend.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (session) {
    return <Dashboard user={session} onLogout={() => { localStorage.removeItem('ayurvediccare_token'); localStorage.removeItem('ayurvediccare_user'); setSession(null) }} />
  }

  return (
    <div className="min-h-screen bg-emerald-50 text-slate-900">
      <header className="mx-auto max-w-6xl px-6 py-8">
        <nav className="flex items-center justify-between rounded-full border border-emerald-200 bg-white/80 px-5 py-3 shadow-sm backdrop-blur">
          <div className="text-lg font-bold tracking-tight text-emerald-800">AyurvedicCare</div>
          <div className="hidden gap-6 text-sm text-slate-600 md:flex">
            <a href="#features">Features</a>
            <a href="#roles">Roles</a>
            <a href="#flow">Flow</a>
          </div>
          <button onClick={() => openAuth('login')} className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-800">
            Login
          </button>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-16">
        <section className="grid items-center gap-10 rounded-3xl bg-gradient-to-r from-emerald-700 to-lime-600 p-8 text-white shadow-xl md:grid-cols-2 md:p-12">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-100">Holistic care platform</p>
            <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">
              Modern care for Ayurvedic practice management
            </h1>
            <p className="mt-5 max-w-xl text-base text-emerald-50 md:text-lg">
              Connect patients with trusted practitioners, streamline appointments, and keep consultation records organized in one secure platform.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <button onClick={() => openAuth('register', 'PATIENT')} className="rounded-full bg-white px-5 py-3 font-medium text-emerald-800 shadow-sm hover:bg-emerald-50">
                Register as patient
              </button>
              <button onClick={() => openAuth('register', 'PRACTITIONER')} className="rounded-full border border-white/60 px-5 py-3 font-medium text-white hover:bg-white/10">
                Become practitioner
              </button>
            </div>
          </div>

          <div className="rounded-3xl bg-white/10 p-5 shadow-inner backdrop-blur-sm">
            <div className="rounded-2xl bg-white p-5 text-slate-800 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-600">Today</p>
                  <h2 className="text-2xl font-bold">Appointments</h2>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">42 confirmed</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2">
                  <div>
                    <p className="font-semibold">Dr. Maya Nair</p>
                    <p className="text-sm text-slate-500">Ayurveda consultation</p>
                  </div>
                  <span className="text-sm font-medium text-emerald-700">10:30 AM</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-amber-50 px-3 py-2">
                  <div>
                    <p className="font-semibold">Dr. Arjun Rao</p>
                    <p className="text-sm text-slate-500">Panchakarma review</p>
                  </div>
                  <span className="text-sm font-medium text-amber-700">1:15 PM</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-slate-100 px-3 py-2">
                  <div>
                    <p className="font-semibold">Admin review</p>
                    <p className="text-sm text-slate-500">Practitioner verification</p>
                  </div>
                  <span className="text-sm font-medium text-slate-700">3 pending</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mt-16">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Platform features</p>
              <h2 className="mt-2 text-3xl font-bold">Built for care continuity</h2>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
            {features.map((feature) => (
              <div key={feature} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-lg text-emerald-700">✓</div>
                <p className="text-sm font-medium leading-6 text-slate-700">{feature}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="roles" className="mt-16">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">User roles</p>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {roles.map((role) => (
              <div key={role.name} className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
                <div className="mb-4 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
                  {role.name}
                </div>
                <p className="text-slate-600">{role.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="flow" className="mt-16 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Application flow</p>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {['Register/Login', 'Create profile', 'Book consultation', 'Review records'].map((step, index) => (
              <div key={step} className="rounded-2xl bg-emerald-50 p-4 text-center">
                <div className="mb-2 text-xl font-bold text-emerald-700">0{index + 1}</div>
                <p className="font-medium text-slate-700">{step}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {authMode && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-slate-950/50 px-6" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">AyurvedicCare</p>
                <h2 className="mt-2 text-3xl font-bold text-slate-900">{authMode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
              </div>
              <button type="button" onClick={() => setAuthMode(null)} className="text-2xl leading-none text-slate-400 hover:text-slate-700" aria-label="Close authentication dialog">&times;</button>
            </div>

            <form onSubmit={submitAuth} className="mt-6 space-y-4">
              {authMode === 'register' && (
                <label className="block text-sm font-medium text-slate-700">
                  Full name
                  <input required value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />
                </label>
              )}
              <label className="block text-sm font-medium text-slate-700">
                Email
                <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Password
                <input required minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />
              </label>
              {authMode === 'register' && (
                <label className="block text-sm font-medium text-slate-700">
                  Account type
                  <select value={role} onChange={(event) => setRole(event.target.value as 'PATIENT' | 'PRACTITIONER')} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100">
                    <option value="PATIENT">Patient</option>
                    <option value="PRACTITIONER">Practitioner</option>
                  </select>
                </label>
              )}
              {message && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>}
              <button disabled={isSubmitting} className="w-full rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60">
                {isSubmitting ? 'Please wait...' : authMode === 'login' ? 'Login' : 'Create account'}
              </button>
            </form>

            <button type="button" onClick={() => openAuth(authMode === 'login' ? 'register' : 'login', role)} className="mt-4 w-full text-sm text-emerald-700 hover:text-emerald-900">
              {authMode === 'login' ? 'Need an account? Register here' : 'Already registered? Login here'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
