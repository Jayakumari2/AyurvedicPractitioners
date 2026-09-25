import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

type Role = 'PATIENT' | 'PRACTITIONER'

type SessionUser = {
  fullName: string
  role: Role
}

type Post = {
  id: number
  practitionerUserId: number
  practitionerName: string
  specialization: string
  title: string
  content: string
  topic: string
  createdAt: string
  mediaUrl?: string
  mediaType?: 'IMAGE' | 'VIDEO' | 'GIF'
  likeCount: number
  likedByCurrentUser: boolean
  commentCount: number
}

type Comment = { id: number; authorName: string; content: string; createdAt: string }

type Practitioner = {
  id: number
  user: { id: number; fullName: string }
  title: string
  specialization: string
  bio: string
  experienceYears: number
  consultationFee: number
}

type Appointment = {
  id: number
  date: string
  startTime: string
  endTime: string
  status: string
  notes?: string
  patientProfile?: { user?: { fullName?: string } }
  practitionerProfile?: { user?: { fullName?: string } }
}

type DashboardProps = {
  user: SessionUser
  onLogout: () => void
}

const API_URL = 'http://localhost:8080'
const tabs = [
  { id: 'feed', label: 'Community feed' },
  { id: 'discover', label: 'Discover practitioners' },
  { id: 'saved', label: 'Saved posts' },
  { id: 'appointments', label: 'Appointments' },
  { id: 'profile', label: 'My profile' },
]

function Dashboard({ user, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('feed')
  const [posts, setPosts] = useState<Post[]>([])
  const [practitioners, setPractitioners] = useState<Practitioner[]>([])
  const [following, setFollowing] = useState<number[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [postForm, setPostForm] = useState({ title: '', topic: 'Clinical insight', content: '', mediaUrl: '', mediaType: 'IMAGE' as 'IMAGE' | 'VIDEO' | 'GIF' })
  const [comments, setComments] = useState<Record<number, Comment[]>>({})
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({})
  const [openComments, setOpenComments] = useState<number[]>([])
  const [savedPostIds, setSavedPostIds] = useState<number[]>(() => JSON.parse(localStorage.getItem('ayurvediccare_saved_posts') ?? '[]') as number[])
  const [appointmentTarget, setAppointmentTarget] = useState<Practitioner | null>(null)
  const [appointmentForm, setAppointmentForm] = useState({ date: '', startTime: '10:00', endTime: '10:30', notes: '' })
  const [patientProfile, setPatientProfile] = useState({ phone: '', dateOfBirth: '', gender: '', address: '' })
  const [practitionerProfile, setPractitionerProfile] = useState({ title: '', specialization: '', qualifications: '', experienceYears: '0', licenseNumber: '', bio: '', clinicAddress: '', consultationFee: '0' })

  const token = localStorage.getItem('ayurvediccare_token') ?? ''
  const firstName = user.fullName.split(' ')[0]

  const apiFetch = async (path: string, options: RequestInit = {}) => {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.message ?? data.error ?? `Request failed (${response.status}). Please try again.`)
    return data
  }

  const loadDashboard = async () => {
    setLoading(true)
    try {
      const requests: Promise<unknown>[] = [apiFetch('/api/social/feed'), apiFetch('/api/practitioners/discover')]
      if (user.role === 'PATIENT') requests.push(apiFetch('/api/social/following'))
      requests.push(apiFetch(user.role === 'PATIENT' ? '/api/patients/appointments' : '/api/practitioners/appointments'))
      const results = await Promise.allSettled(requests)
      setPosts(results[0].status === 'fulfilled' ? results[0].value as Post[] : [])
      setPractitioners(results[1].status === 'fulfilled' ? results[1].value as Practitioner[] : [])
      if (user.role === 'PATIENT' && results[2]?.status === 'fulfilled') setFollowing(results[2].value as number[])
      const appointmentResult = results[results.length - 1]
      setAppointments(appointmentResult.status === 'fulfilled' ? appointmentResult.value as Appointment[] : [])
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to load your dashboard.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadDashboard()
  }, [user.role])

  const toggleFollow = async (practitioner: Practitioner) => {
    const isFollowing = following.includes(practitioner.user.id)
    try {
      await apiFetch(`/api/social/practitioners/${practitioner.user.id}/follow`, { method: isFollowing ? 'DELETE' : 'POST' })
      setFollowing((current) => isFollowing ? current.filter((id) => id !== practitioner.user.id) : [...current, practitioner.user.id])
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to update following.')
    }
  }

  const publishPost = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      const post = await apiFetch('/api/social/posts', { method: 'POST', body: JSON.stringify(postForm) })
      setPosts((current) => [post as Post, ...current])
      setPostForm({ title: '', topic: 'Clinical insight', content: '', mediaUrl: '', mediaType: 'IMAGE' })
      setNotice('Your insight is live in the community feed.')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to publish your post.')
    }
  }

  const toggleLike = async (post: Post) => {
    try {
      const data = await apiFetch(`/api/social/posts/${post.id}/like`, { method: post.likedByCurrentUser ? 'DELETE' : 'POST' })
      setPosts((current) => current.map((item) => item.id === post.id ? { ...item, likedByCurrentUser: data.liked, likeCount: data.likeCount } : item))
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Unable to update like.') }
  }

  const toggleComments = async (postId: number) => {
    if (openComments.includes(postId)) {
      setOpenComments((current) => current.filter((id) => id !== postId))
      return
    }
    try {
      const data = await apiFetch(`/api/social/posts/${postId}/comments`)
      setComments((current) => ({ ...current, [postId]: data as Comment[] }))
      setOpenComments((current) => [...current, postId])
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Unable to load comments.') }
  }

  const addComment = async (postId: number, event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const content = commentDrafts[postId]?.trim()
    if (!content) return
    try {
      const comment = await apiFetch(`/api/social/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify({ content }) })
      setComments((current) => ({ ...current, [postId]: [...(current[postId] ?? []), comment as Comment] }))
      setPosts((current) => current.map((post) => post.id === postId ? { ...post, commentCount: post.commentCount + 1 } : post))
      setCommentDrafts((current) => ({ ...current, [postId]: '' }))
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Unable to add comment.') }
  }

  const toggleSave = (postId: number) => {
    const next = savedPostIds.includes(postId) ? savedPostIds.filter((id) => id !== postId) : [...savedPostIds, postId]
    setSavedPostIds(next)
    localStorage.setItem('ayurvediccare_saved_posts', JSON.stringify(next))
    setNotice(next.includes(postId) ? 'Post saved to your reading list.' : 'Post removed from your reading list.')
  }

  const sharePost = async (post: Post) => {
    try {
      await navigator.clipboard.writeText(`${post.title} - AyurvedicCare`)
      setNotice('Post link copied to your clipboard.')
    } catch { setNotice('Sharing is unavailable in this browser.') }
  }

  const bookAppointment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!appointmentTarget) return
    const params = new URLSearchParams({ practitionerUserId: String(appointmentTarget.user.id), ...appointmentForm })
    try {
      await apiFetch(`/api/appointments?${params.toString()}`, { method: 'POST' })
      setAppointmentTarget(null)
      setNotice(`Appointment request sent to ${appointmentTarget.user.fullName}.`)
      await loadDashboard()
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Complete your patient profile before booking.')
    }
  }

  const confirmAppointment = async (id: number) => {
    try {
      await apiFetch(`/api/appointments/${id}/confirm`, { method: 'PUT' })
      setAppointments((current) => current.map((appointment) => appointment.id === id ? { ...appointment, status: 'CONFIRMED' } : appointment))
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to confirm appointment.')
    }
  }

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      const profilePath = user.role === 'PATIENT' ? '/api/patients/profile' : '/api/practitioners/profile'
      const profile = user.role === 'PATIENT'
        ? { ...patientProfile, emergencyContact: '', medicalHistory: '' }
        : { ...practitionerProfile, experienceYears: Number(practitionerProfile.experienceYears), consultationFee: Number(practitionerProfile.consultationFee) }
      const existing = await fetch(`${API_URL}${user.role === 'PATIENT' ? '/api/patients/me' : '/api/practitioners/me'}`, { headers: { Authorization: `Bearer ${token}` } })
      await apiFetch(profilePath, { method: existing.ok ? 'PUT' : 'POST', body: JSON.stringify(profile) })
      setNotice('Your profile is ready. Your dashboard is now fully connected.')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to save your profile.')
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f8f2] text-slate-900">
      <header className="border-b border-emerald-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-lg font-black tracking-tight text-emerald-800">AyurvedicCare</p>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{user.role === 'PATIENT' ? 'Patient circle' : 'Practitioner network'}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block"><p className="text-sm font-semibold">{user.fullName}</p><p className="text-xs text-slate-500">{user.role.toLowerCase()}</p></div>
            <button onClick={onLogout} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-emerald-300 hover:text-emerald-700">Log out</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#0d604b] via-emerald-700 to-[#8aa83d] p-8 text-white shadow-xl md:p-10">
          <div className="relative z-[1] max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-100">Good morning, {firstName}</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Your place to learn, share, and care.</h1>
            <p className="mt-4 max-w-xl text-emerald-50">A thoughtful network for Ayurvedic knowledge, trusted practitioners, and better care journeys.</p>
          </div>
          <div className="absolute -right-12 -top-20 h-72 w-72 rounded-full border-[36px] border-white/10" />
          <div className="absolute bottom-5 right-10 hidden gap-3 md:flex"><span className="rounded-2xl bg-white/15 px-4 py-3 text-sm backdrop-blur">{posts.length} community insights</span><span className="rounded-2xl bg-white/15 px-4 py-3 text-sm backdrop-blur">{user.role === 'PATIENT' ? `${following.length} following` : `${appointments.length} appointments`}</span></div>
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
          <aside className="h-fit rounded-3xl border border-emerald-100 bg-white p-3 shadow-sm">
            {tabs.map((tab) => <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`mb-1 w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${activeTab === tab.id ? 'bg-emerald-700 text-white shadow-md' : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-800'}`}>{tab.label}</button>)}
            <div className="mt-5 rounded-2xl bg-amber-50 p-4"><p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">Community note</p><p className="mt-2 text-sm leading-5 text-amber-900">Share evidence-led insights and keep patient details private.</p></div>
          </aside>

          <section className="min-w-0">
            {notice && <button onClick={() => setNotice('')} className="mb-5 w-full rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-left text-sm text-emerald-800">{notice} <span className="float-right">&times;</span></button>}
            {loading ? <div className="rounded-3xl bg-white p-12 text-center text-slate-500 shadow-sm">Loading your community...</div> : <>
              {activeTab === 'feed' && <InteractiveFeed posts={posts} user={user} postForm={postForm} setPostForm={setPostForm} publishPost={publishPost} toggleLike={toggleLike} toggleComments={toggleComments} addComment={addComment} comments={comments} openComments={openComments} commentDrafts={commentDrafts} setCommentDrafts={setCommentDrafts} toggleSave={toggleSave} sharePost={sharePost} savedPostIds={savedPostIds} following={following} toggleFollow={toggleFollow} openBooking={(post) => { setAppointmentTarget({ id: 0, user: { id: post.practitionerUserId, fullName: post.practitionerName }, title: 'Ayurvedic practitioner', specialization: post.specialization, bio: '', experienceYears: 0, consultationFee: 0 }); setAppointmentForm({ date: '', startTime: '10:00', endTime: '10:30', notes: '' }) }} />}
              {activeTab === 'discover' && <Discover practitioners={practitioners} following={following} user={user} toggleFollow={toggleFollow} openBooking={(practitioner) => { setAppointmentTarget(practitioner); setAppointmentForm({ date: '', startTime: '10:00', endTime: '10:30', notes: '' }) }} />}
              {activeTab === 'saved' && <InteractiveFeed posts={posts.filter((post) => savedPostIds.includes(post.id))} user={user} postForm={postForm} setPostForm={setPostForm} publishPost={publishPost} toggleLike={toggleLike} toggleComments={toggleComments} addComment={addComment} comments={comments} openComments={openComments} commentDrafts={commentDrafts} setCommentDrafts={setCommentDrafts} toggleSave={toggleSave} sharePost={sharePost} savedPostIds={savedPostIds} following={following} toggleFollow={toggleFollow} openBooking={(post) => { setAppointmentTarget({ id: 0, user: { id: post.practitionerUserId, fullName: post.practitionerName }, title: 'Ayurvedic practitioner', specialization: post.specialization, bio: '', experienceYears: 0, consultationFee: 0 }); setAppointmentForm({ date: '', startTime: '10:00', endTime: '10:30', notes: '' }) }} />}
              {activeTab === 'appointments' && <Appointments appointments={appointments} user={user} confirmAppointment={confirmAppointment} />}
              {activeTab === 'profile' && <Profile user={user} patientProfile={patientProfile} setPatientProfile={setPatientProfile} practitionerProfile={practitionerProfile} setPractitionerProfile={setPractitionerProfile} saveProfile={saveProfile} />}
            </>}
          </section>
        </div>
      </main>

      {appointmentTarget && <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/50 px-6"><form onSubmit={bookAppointment} className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">New appointment</p><h2 className="mt-2 text-2xl font-black">{appointmentTarget.user.fullName}</h2></div><button type="button" onClick={() => setAppointmentTarget(null)} className="text-2xl text-slate-400">&times;</button></div><div className="mt-6 space-y-4"><label className="block text-sm font-semibold">Date<input required type="date" value={appointmentForm.date} onChange={(event) => setAppointmentForm({ ...appointmentForm, date: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label><div className="grid grid-cols-2 gap-3"><label className="block text-sm font-semibold">Start<input required type="time" value={appointmentForm.startTime} onChange={(event) => setAppointmentForm({ ...appointmentForm, startTime: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label><label className="block text-sm font-semibold">End<input required type="time" value={appointmentForm.endTime} onChange={(event) => setAppointmentForm({ ...appointmentForm, endTime: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label></div><label className="block text-sm font-semibold">Note<textarea value={appointmentForm.notes} onChange={(event) => setAppointmentForm({ ...appointmentForm, notes: event.target.value })} className="mt-1 min-h-24 w-full rounded-xl border border-slate-300 px-3 py-2.5" placeholder="What would you like to discuss?" /></label><button className="w-full rounded-xl bg-emerald-700 px-4 py-3 font-bold text-white hover:bg-emerald-800">Request appointment</button></div></form></div>}
    </div>
  )
}

type PostForm = { title: string; topic: string; content: string; mediaUrl: string; mediaType: 'IMAGE' | 'VIDEO' | 'GIF' }

function InteractiveFeed({ posts, user, postForm, setPostForm, publishPost, toggleLike, toggleComments, addComment, comments, openComments, commentDrafts, setCommentDrafts, toggleSave, sharePost, savedPostIds, following, toggleFollow, openBooking }: { posts: Post[]; user: SessionUser; postForm: PostForm; setPostForm: (value: PostForm) => void; publishPost: (event: FormEvent<HTMLFormElement>) => void; toggleLike: (post: Post) => void; toggleComments: (postId: number) => void; addComment: (postId: number, event: FormEvent<HTMLFormElement>) => void; comments: Record<number, Comment[]>; openComments: number[]; commentDrafts: Record<number, string>; setCommentDrafts: (value: Record<number, string>) => void; toggleSave: (postId: number) => void; sharePost: (post: Post) => void; savedPostIds: number[]; following: number[]; toggleFollow: (practitioner: Practitioner) => void; openBooking: (post: Post) => void }) {
  return <div className="space-y-5">
    {user.role === 'PRACTITIONER' && <form onSubmit={publishPost} className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Professional voice</p><h2 className="mt-1 text-xl font-black">Share a new finding</h2></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Practitioner post</span></div><div className="mt-5 grid gap-3 md:grid-cols-[1fr_180px]"><input required placeholder="Headline for your insight" value={postForm.title} onChange={(event) => setPostForm({ ...postForm, title: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2.5" /><select value={postForm.topic} onChange={(event) => setPostForm({ ...postForm, topic: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2.5"><option>Clinical insight</option><option>Research note</option><option>Wellness practice</option><option>Case reflection</option></select></div><textarea required minLength={20} placeholder="Share the useful part of your work with the community..." value={postForm.content} onChange={(event) => setPostForm({ ...postForm, content: event.target.value })} className="mt-3 min-h-28 w-full rounded-xl border border-slate-200 px-3 py-2.5" /><div className="mt-3 grid gap-3 md:grid-cols-[1fr_140px]"><input type="url" placeholder="Media URL (image, video, or GIF)" value={postForm.mediaUrl} onChange={(event) => setPostForm({ ...postForm, mediaUrl: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2.5" /><select value={postForm.mediaType} onChange={(event) => setPostForm({ ...postForm, mediaType: event.target.value as PostForm['mediaType'] })} className="rounded-xl border border-slate-200 px-3 py-2.5"><option value="IMAGE">Image</option><option value="VIDEO">Video</option><option value="GIF">GIF</option></select></div><p className="mt-2 text-xs text-slate-400">Use a public HTTPS media URL. Images and GIFs render inline; videos include native controls.</p><button className="mt-3 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800">Publish insight</button></form>}
    {posts.length === 0 ? <EmptyState title="The community is just getting started" text="Follow practitioners or publish the first thoughtful insight in this space." /> : posts.map((post) => <article key={post.id} className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm"><div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 font-black text-emerald-800">{post.practitionerName.charAt(0)}</div><div><h3 className="font-bold">{post.practitionerName}</h3><p className="text-sm text-slate-500">{post.specialization} · {new Date(post.createdAt).toLocaleDateString()}</p></div></div><div className="flex items-center gap-2"><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">{post.topic}</span>{user.role === 'PATIENT' && <button onClick={() => toggleFollow({ id: 0, user: { id: post.practitionerUserId, fullName: post.practitionerName }, title: 'Ayurvedic practitioner', specialization: post.specialization, bio: '', experienceYears: 0, consultationFee: 0 })} className="rounded-full border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-50">{following.includes(post.practitionerUserId) ? 'Following' : 'Follow'}</button>}</div></div><h2 className="mt-5 text-xl font-black text-slate-900">{post.title}</h2><p className="mt-2 whitespace-pre-wrap leading-7 text-slate-600">{post.content}</p>{post.mediaUrl && (post.mediaType === 'VIDEO' ? <video controls className="mt-5 max-h-96 w-full rounded-2xl bg-slate-950" src={post.mediaUrl} /> : <img className="mt-5 max-h-96 w-full rounded-2xl object-cover" src={post.mediaUrl} alt={post.title} />)}<div className="mt-5 flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-sm font-semibold"><button onClick={() => toggleLike(post)} className={post.likedByCurrentUser ? 'text-rose-600' : 'text-slate-500 hover:text-rose-600'}>{post.likedByCurrentUser ? '♥ Liked' : '♡ Like'} · {post.likeCount}</button><button onClick={() => toggleComments(post.id)} className="text-slate-500 hover:text-emerald-700">Comments · {post.commentCount}</button>{user.role === 'PATIENT' && <button onClick={() => openBooking(post)} className="text-emerald-700 hover:text-emerald-900">Book appointment</button>}<button onClick={() => toggleSave(post.id)} className={savedPostIds.includes(post.id) ? 'text-emerald-700' : 'text-slate-500 hover:text-emerald-700'}>{savedPostIds.includes(post.id) ? 'Saved' : 'Save for later'}</button><button onClick={() => sharePost(post)} className="text-slate-500 hover:text-emerald-700">Share</button></div>{openComments.includes(post.id) && <div className="mt-4 rounded-2xl bg-slate-50 p-4"><div className="space-y-3">{(comments[post.id] ?? []).length === 0 ? <p className="text-sm text-slate-400">Start the conversation.</p> : comments[post.id].map((comment) => <div key={comment.id}><p className="text-sm font-bold">{comment.authorName}</p><p className="text-sm leading-6 text-slate-600">{comment.content}</p></div>)}</div><form onSubmit={(event) => addComment(post.id, event)} className="mt-4 flex gap-2"><input required maxLength={1000} value={commentDrafts[post.id] ?? ''} onChange={(event) => setCommentDrafts({ ...commentDrafts, [post.id]: event.target.value })} placeholder="Add a thoughtful comment..." className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" /><button className="rounded-xl bg-emerald-700 px-3 py-2 text-sm font-bold text-white">Post</button></form></div>}</article>)}
  </div>
}

export function Feed({ posts, user, postForm, setPostForm, publishPost }: { posts: Post[]; user: SessionUser; postForm: { title: string; topic: string; content: string }; setPostForm: (value: { title: string; topic: string; content: string }) => void; publishPost: (event: React.FormEvent<HTMLFormElement>) => void }) {
  return <div className="space-y-5">
    {user.role === 'PRACTITIONER' && <form onSubmit={publishPost} className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Professional voice</p><h2 className="mt-1 text-xl font-black">Share a new finding</h2></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Practitioner post</span></div><div className="mt-5 grid gap-3 md:grid-cols-[1fr_180px]"><input required placeholder="Headline for your insight" value={postForm.title} onChange={(event) => setPostForm({ ...postForm, title: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2.5" /><select value={postForm.topic} onChange={(event) => setPostForm({ ...postForm, topic: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2.5"><option>Clinical insight</option><option>Research note</option><option>Wellness practice</option><option>Case reflection</option></select></div><textarea required minLength={20} placeholder="Share the useful part of your work with the community..." value={postForm.content} onChange={(event) => setPostForm({ ...postForm, content: event.target.value })} className="mt-3 min-h-28 w-full rounded-xl border border-slate-200 px-3 py-2.5" /><button className="mt-3 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800">Publish insight</button></form>}
    {posts.length === 0 ? <EmptyState title="The community is just getting started" text="Follow practitioners or publish the first thoughtful insight in this space." /> : posts.map((post) => <article key={post.id} className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm"><div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 font-black text-emerald-800">{post.practitionerName.charAt(0)}</div><div><h3 className="font-bold">{post.practitionerName}</h3><p className="text-sm text-slate-500">{post.specialization} · {new Date(post.createdAt).toLocaleDateString()}</p></div></div><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">{post.topic}</span></div><h2 className="mt-5 text-xl font-black text-slate-900">{post.title}</h2><p className="mt-2 whitespace-pre-wrap leading-7 text-slate-600">{post.content}</p><div className="mt-5 flex gap-5 border-t border-slate-100 pt-4 text-sm font-semibold text-slate-500"><span>Insight</span><span>Save for later</span><span>Share</span></div></article>)}
  </div>
}

function Discover({ practitioners, following, user, toggleFollow, openBooking }: { practitioners: Practitioner[]; following: number[]; user: SessionUser; toggleFollow: (practitioner: Practitioner) => void; openBooking: (practitioner: Practitioner) => void }) {
  return <div><div className="mb-6"><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">The network</p><h2 className="mt-1 text-3xl font-black">Practitioners worth knowing</h2><p className="mt-2 text-slate-500">Find verified Ayurvedic voices and build your care circle.</p></div>{practitioners.length === 0 ? <EmptyState title="No verified practitioners yet" text="Practitioner profiles will appear here after admin verification." /> : <div className="grid gap-5 md:grid-cols-2">{practitioners.map((practitioner) => <article key={practitioner.id} className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm"><div className="flex items-start justify-between"><div className="flex items-center gap-3"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#dcecc6] text-xl font-black text-emerald-800">{practitioner.user.fullName.charAt(0)}</div><div><h3 className="font-black">{practitioner.user.fullName}</h3><p className="text-sm text-emerald-700">{practitioner.title}</p></div></div><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">Verified</span></div><p className="mt-5 font-semibold text-slate-700">{practitioner.specialization}</p><p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">{practitioner.bio || 'Sharing practical Ayurvedic care for everyday wellbeing.'}</p><p className="mt-4 text-sm text-slate-500">{practitioner.experienceYears} years experience · ₹{practitioner.consultationFee} consultation</p><div className="mt-5 flex gap-2">{user.role === 'PATIENT' && <button onClick={() => openBooking(practitioner)} className="flex-1 rounded-xl bg-emerald-700 px-3 py-2.5 text-sm font-bold text-white hover:bg-emerald-800">Book appointment</button>}<button onClick={() => toggleFollow(practitioner)} className="rounded-xl border border-emerald-200 px-3 py-2.5 text-sm font-bold text-emerald-700 hover:bg-emerald-50">{following.includes(practitioner.user.id) ? 'Following' : 'Follow'}</button></div></article>)}</div>}</div>
}

function Appointments({ appointments, user, confirmAppointment }: { appointments: Appointment[]; user: SessionUser; confirmAppointment: (id: number) => void }) {
  return <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Care schedule</p><h2 className="mt-1 text-3xl font-black">{user.role === 'PATIENT' ? 'Your appointments' : 'Patient requests'}</h2><div className="mt-6 space-y-3">{appointments.length === 0 ? <EmptyState title="No appointments yet" text={user.role === 'PATIENT' ? 'Discover a practitioner and request your first consultation.' : 'New patient requests will appear here.'} /> : appointments.map((appointment) => <div key={appointment.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold">{user.role === 'PATIENT' ? appointment.practitionerProfile?.user?.fullName ?? 'Practitioner' : appointment.patientProfile?.user?.fullName ?? 'Patient'}</p><p className="mt-1 text-sm text-slate-500">{appointment.date} · {appointment.startTime} - {appointment.endTime}</p></div><div className="flex items-center gap-3"><span className={`rounded-full px-3 py-1 text-xs font-bold ${appointment.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{appointment.status}</span>{user.role === 'PRACTITIONER' && appointment.status === 'PENDING' && <button onClick={() => confirmAppointment(appointment.id)} className="rounded-xl bg-emerald-700 px-3 py-2 text-sm font-bold text-white">Confirm</button>}</div></div>)}</div></div>
}

function Profile({ user, patientProfile, setPatientProfile, practitionerProfile, setPractitionerProfile, saveProfile }: { user: SessionUser; patientProfile: { phone: string; dateOfBirth: string; gender: string; address: string }; setPatientProfile: (value: { phone: string; dateOfBirth: string; gender: string; address: string }) => void; practitionerProfile: { title: string; specialization: string; qualifications: string; experienceYears: string; licenseNumber: string; bio: string; clinicAddress: string; consultationFee: string }; setPractitionerProfile: (value: { title: string; specialization: string; qualifications: string; experienceYears: string; licenseNumber: string; bio: string; clinicAddress: string; consultationFee: string }) => void; saveProfile: (event: React.FormEvent<HTMLFormElement>) => void }) {
  return <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Account setup</p><h2 className="mt-1 text-3xl font-black">Complete your {user.role === 'PATIENT' ? 'care profile' : 'professional profile'}</h2><p className="mt-2 text-slate-500">Your profile unlocks the private workflows behind the community.</p><form onSubmit={saveProfile} className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">{user.role === 'PATIENT' ? <div className="grid gap-4 md:grid-cols-2"><label className="text-sm font-semibold">Phone<input required value={patientProfile.phone} onChange={(event) => setPatientProfile({ ...patientProfile, phone: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label><label className="text-sm font-semibold">Date of birth<input required type="date" value={patientProfile.dateOfBirth} onChange={(event) => setPatientProfile({ ...patientProfile, dateOfBirth: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label><label className="text-sm font-semibold">Gender<input required value={patientProfile.gender} onChange={(event) => setPatientProfile({ ...patientProfile, gender: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label><label className="text-sm font-semibold">Address<input value={patientProfile.address} onChange={(event) => setPatientProfile({ ...patientProfile, address: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label></div> : <div className="grid gap-4 md:grid-cols-2"><label className="text-sm font-semibold">Professional title<input required value={practitionerProfile.title} onChange={(event) => setPractitionerProfile({ ...practitionerProfile, title: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label><label className="text-sm font-semibold">Specialization<input required value={practitionerProfile.specialization} onChange={(event) => setPractitionerProfile({ ...practitionerProfile, specialization: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label><label className="text-sm font-semibold">Qualifications<input required value={practitionerProfile.qualifications} onChange={(event) => setPractitionerProfile({ ...practitionerProfile, qualifications: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label><label className="text-sm font-semibold">License number<input required value={practitionerProfile.licenseNumber} onChange={(event) => setPractitionerProfile({ ...practitionerProfile, licenseNumber: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label><label className="text-sm font-semibold">Years of experience<input required type="number" min="0" value={practitionerProfile.experienceYears} onChange={(event) => setPractitionerProfile({ ...practitionerProfile, experienceYears: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label><label className="text-sm font-semibold">Consultation fee<input required type="number" min="0" value={practitionerProfile.consultationFee} onChange={(event) => setPractitionerProfile({ ...practitionerProfile, consultationFee: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label><label className="text-sm font-semibold md:col-span-2">Bio<textarea required value={practitionerProfile.bio} onChange={(event) => setPractitionerProfile({ ...practitionerProfile, bio: event.target.value })} className="mt-1 min-h-24 w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label><label className="text-sm font-semibold md:col-span-2">Clinic address<input required value={practitionerProfile.clinicAddress} onChange={(event) => setPractitionerProfile({ ...practitionerProfile, clinicAddress: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label></div>}<button className="mt-6 rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white hover:bg-emerald-800">Save profile</button></form></div>
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="rounded-3xl border border-dashed border-emerald-200 bg-white p-10 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-xl text-emerald-700">+</div><h3 className="mt-4 font-black">{title}</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{text}</p></div>
}

export default Dashboard
