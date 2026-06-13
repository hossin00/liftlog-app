import { useState, useEffect } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp, Dumbbell, TrendingUp, Calendar, X } from 'lucide-react'

const ACCENT = '#7C3AED'

interface Set {
  reps: number
  weight: number
  unit: 'kg' | 'lbs'
}

interface ExerciseEntry {
  id: string
  name: string
  sets: Set[]
  note: string
}

interface WorkoutSession {
  id: string
  date: string
  name: string
  exercises: ExerciseEntry[]
  duration: number
}

const EXERCISES = [
  'Bench Press', 'Squat', 'Deadlift', 'Overhead Press', 'Barbell Row',
  'Pull-Up', 'Chin-Up', 'Dips', 'Incline Bench', 'Leg Press',
  'Romanian Deadlift', 'Lat Pulldown', 'Cable Row', 'Shoulder Press',
  'Bicep Curl', 'Tricep Pushdown', 'Leg Curl', 'Leg Extension',
  'Calf Raise', 'Hip Thrust', 'Face Pull', 'Chest Fly',
]

const TEMPLATES = [
  { name: 'Push Day', exercises: ['Bench Press', 'Overhead Press', 'Incline Bench', 'Tricep Pushdown', 'Chest Fly'] },
  { name: 'Pull Day', exercises: ['Deadlift', 'Barbell Row', 'Lat Pulldown', 'Cable Row', 'Bicep Curl'] },
  { name: 'Leg Day', exercises: ['Squat', 'Leg Press', 'Romanian Deadlift', 'Leg Curl', 'Calf Raise'] },
  { name: 'Full Body', exercises: ['Squat', 'Bench Press', 'Barbell Row', 'Overhead Press', 'Hip Thrust'] },
]

function todayStr() { return new Date().toISOString().slice(0, 10) }

export default function App() {
  const [sessions, setSessions] = useState<WorkoutSession[]>(() => {
    try { return JSON.parse(localStorage.getItem('liftlog_sessions') || '[]') } catch { return [] }
  })
  const [tab, setTab] = useState<'log' | 'history' | 'stats'>('log')
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null)
  const [showAddEx, setShowAddEx] = useState(false)
  const [exSearch, setExSearch] = useState('')
  const [showNewSession, setShowNewSession] = useState(false)
  const [sessionName, setSessionName] = useState('')
  const [unit, setUnit] = useState<'kg' | 'lbs'>(() => (localStorage.getItem('liftlog_unit') as 'kg' | 'lbs') || 'kg')
  const [expandEx, setExpandEx] = useState<string | null>(null)
  const [startTime, setStartTime] = useState<number>(0)

  useEffect(() => {
    localStorage.setItem('liftlog_sessions', JSON.stringify(sessions))
  }, [sessions])

  useEffect(() => {
    localStorage.setItem('liftlog_unit', unit)
  }, [unit])

  function startSession(name: string) {
    const s: WorkoutSession = {
      id: Date.now().toString(),
      date: todayStr(),
      name: name || 'Workout',
      exercises: [],
      duration: 0,
    }
    setActiveSession(s)
    setStartTime(Date.now())
    setShowNewSession(false)
    setSessionName('')
  }

  function startTemplate(t: typeof TEMPLATES[0]) {
    const s: WorkoutSession = {
      id: Date.now().toString(),
      date: todayStr(),
      name: t.name,
      exercises: t.exercises.map(name => ({
        id: Date.now().toString() + name,
        name,
        sets: [{ reps: 8, weight: 0, unit }],
        note: '',
      })),
      duration: 0,
    }
    setActiveSession(s)
    setStartTime(Date.now())
    setShowNewSession(false)
  }

  function finishSession() {
    if (!activeSession) return
    const dur = Math.round((Date.now() - startTime) / 60000)
    const finished = { ...activeSession, duration: dur }
    setSessions(prev => [finished, ...prev])
    setActiveSession(null)
  }

  function addExercise(name: string) {
    if (!activeSession) return
    const ex: ExerciseEntry = {
      id: Date.now().toString(),
      name,
      sets: [{ reps: 8, weight: 0, unit }],
      note: '',
    }
    setActiveSession(prev => prev ? { ...prev, exercises: [...prev.exercises, ex] } : prev)
    setShowAddEx(false)
    setExSearch('')
  }

  function removeExercise(exId: string) {
    setActiveSession(prev => prev ? { ...prev, exercises: prev.exercises.filter(e => e.id !== exId) } : prev)
  }

  function addSet(exId: string) {
    setActiveSession(prev => {
      if (!prev) return prev
      return {
        ...prev,
        exercises: prev.exercises.map(e => {
          if (e.id !== exId) return e
          const last = e.sets[e.sets.length - 1]
          return { ...e, sets: [...e.sets, { ...last }] }
        }),
      }
    })
  }

  function updateSet(exId: string, setIdx: number, field: 'reps' | 'weight', value: string) {
    setActiveSession(prev => {
      if (!prev) return prev
      return {
        ...prev,
        exercises: prev.exercises.map(e => {
          if (e.id !== exId) return e
          const sets = e.sets.map((s, i) => i === setIdx ? { ...s, [field]: parseFloat(value) || 0 } : s)
          return { ...e, sets }
        }),
      }
    })
  }

  function removeSet(exId: string, setIdx: number) {
    setActiveSession(prev => {
      if (!prev) return prev
      return {
        ...prev,
        exercises: prev.exercises.map(e => {
          if (e.id !== exId || e.sets.length <= 1) return e
          return { ...e, sets: e.sets.filter((_, i) => i !== setIdx) }
        }),
      }
    })
  }

  const filteredEx = EXERCISES.filter(e => e.toLowerCase().includes(exSearch.toLowerCase()))

  // Stats: personal records per exercise
  const allExNames = [...new Set(sessions.flatMap(s => s.exercises.map(e => e.name)))]
  const prs: Record<string, { weight: number, date: string }> = {}
  for (const s of sessions) {
    for (const ex of s.exercises) {
      const maxW = Math.max(...ex.sets.map(st => st.weight))
      if (!prs[ex.name] || maxW > prs[ex.name].weight) prs[ex.name] = { weight: maxW, date: s.date }
    }
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#0D0A14', minHeight: '100vh', color: '#F5F5F5' }}>
      <div style={{ background: '#130F1F', padding: '20px 20px 0', borderBottom: '1px solid #2A1F40' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Dumbbell size={22} color={ACCENT} />
            <div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>LiftLog</div>
              <div style={{ fontSize: 11, color: '#555' }}>Weightlifting Tracker</div>
            </div>
          </div>
          <button onClick={() => setUnit(u => u === 'kg' ? 'lbs' : 'kg')}
            style={{ background: '#2A1F40', border: 'none', borderRadius: 8, padding: '6px 12px', color: ACCENT, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
            {unit}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {(['log', 'history', 'stats'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ flex: 1, background: 'none', border: 'none', padding: '10px 0', cursor: 'pointer', color: tab === t ? ACCENT : '#555', fontWeight: tab === t ? 600 : 400, fontSize: 14, borderBottom: `2px solid ${tab === t ? ACCENT : 'transparent'}` }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: 16, maxWidth: 500, margin: '0 auto' }}>
        {tab === 'log' && (
          <>
            {!activeSession ? (
              <>
                <div style={{ textAlign: 'center', padding: '20px 0 24px' }}>
                  <Dumbbell size={44} color="#2A1F40" style={{ margin: '0 auto 12px' }} />
                  <div style={{ color: '#666', marginBottom: 24, fontSize: 14 }}>Start a new workout session</div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 10, fontWeight: 600 }}>TEMPLATES</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {TEMPLATES.map(t => (
                      <button key={t.name} onClick={() => startTemplate(t)}
                        style={{ background: '#130F1F', border: `1px solid #2A1F40`, borderRadius: 12, padding: '14px', textAlign: 'left', cursor: 'pointer', color: '#F5F5F5' }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: ACCENT, marginBottom: 4 }}>{t.name}</div>
                        <div style={{ fontSize: 11, color: '#666' }}>{t.exercises.length} exercises</div>
                      </button>
                    ))}
                  </div>
                </div>

                {showNewSession ? (
                  <div style={{ background: '#130F1F', borderRadius: 16, padding: 18, border: '1px solid #2A1F40' }}>
                    <input placeholder="Session name (optional)" value={sessionName} onChange={e => setSessionName(e.target.value)}
                      style={{ width: '100%', background: '#1E1630', border: 'none', borderRadius: 8, padding: '12px', color: '#F5F5F5', fontSize: 14, marginBottom: 10, boxSizing: 'border-box' }} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setShowNewSession(false)}
                        style={{ flex: 1, background: '#1E1630', border: 'none', borderRadius: 10, padding: '11px', color: '#888', cursor: 'pointer' }}>Cancel</button>
                      <button onClick={() => startSession(sessionName)}
                        style={{ flex: 1, background: ACCENT, border: 'none', borderRadius: 10, padding: '11px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Start</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowNewSession(true)}
                    style={{ width: '100%', background: ACCENT, border: 'none', borderRadius: 12, padding: '14px', color: '#fff', fontWeight: 600, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Plus size={18} /> New Workout
                  </button>
                )}
              </>
            ) : (
              <>
                <div style={{ background: '#130F1F', borderRadius: 14, padding: '14px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #2A1F40' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{activeSession.name}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>{activeSession.exercises.length} exercises in progress</div>
                  </div>
                  <button onClick={finishSession}
                    style={{ background: ACCENT, border: 'none', borderRadius: 10, padding: '8px 16px', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
                    Finish
                  </button>
                </div>

                {activeSession.exercises.map((ex, exIdx) => (
                  <div key={ex.id} style={{ background: '#130F1F', borderRadius: 14, marginBottom: 10, overflow: 'hidden', border: '1px solid #2A1F40' }}>
                    <button onClick={() => setExpandEx(expandEx === ex.id ? null : ex.id)}
                      style={{ width: '100%', background: 'none', border: 'none', padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#F5F5F5', gap: 10 }}>
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{ex.name}</div>
                        <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{ex.sets.length} sets</div>
                      </div>
                      <button onClick={e => { e.stopPropagation(); removeExercise(ex.id) }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#444', marginRight: 4 }}>
                        <X size={15} />
                      </button>
                      {expandEx === ex.id ? <ChevronUp size={16} color="#555" /> : <ChevronDown size={16} color="#555" />}
                    </button>
                    {expandEx === ex.id && (
                      <div style={{ padding: '0 16px 14px', borderTop: '1px solid #1E1630' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '30px 1fr 1fr 30px', gap: 6, marginBottom: 8, padding: '6px 0' }}>
                          <span style={{ fontSize: 11, color: '#555', textAlign: 'center' }}>Set</span>
                          <span style={{ fontSize: 11, color: '#555', textAlign: 'center' }}>Reps</span>
                          <span style={{ fontSize: 11, color: '#555', textAlign: 'center' }}>{unit}</span>
                          <span />
                        </div>
                        {ex.sets.map((set, si) => (
                          <div key={si} style={{ display: 'grid', gridTemplateColumns: '30px 1fr 1fr 30px', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                            <div style={{ textAlign: 'center', fontSize: 13, color: '#666' }}>{si + 1}</div>
                            <input type="number" value={set.reps || ''} onChange={e => updateSet(ex.id, si, 'reps', e.target.value)}
                              style={{ background: '#1E1630', border: 'none', borderRadius: 8, padding: '8px', color: '#F5F5F5', fontSize: 14, textAlign: 'center' }} />
                            <input type="number" value={set.weight || ''} onChange={e => updateSet(ex.id, si, 'weight', e.target.value)}
                              style={{ background: '#1E1630', border: 'none', borderRadius: 8, padding: '8px', color: '#F5F5F5', fontSize: 14, textAlign: 'center' }} />
                            <button onClick={() => removeSet(ex.id, si)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#444' }}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                        <button onClick={() => addSet(ex.id)}
                          style={{ background: '#1E1630', border: 'none', borderRadius: 8, padding: '8px', color: ACCENT, fontSize: 13, cursor: 'pointer', width: '100%', marginTop: 4 }}>
                          + Add Set
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {showAddEx ? (
                  <div style={{ background: '#130F1F', borderRadius: 14, padding: 16, border: '1px solid #2A1F40' }}>
                    <input placeholder="Search exercise..." value={exSearch} onChange={e => setExSearch(e.target.value)}
                      style={{ width: '100%', background: '#1E1630', border: 'none', borderRadius: 8, padding: '10px 12px', color: '#F5F5F5', fontSize: 14, marginBottom: 10, boxSizing: 'border-box' }} />
                    <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                      {filteredEx.map(name => (
                        <button key={name} onClick={() => addExercise(name)}
                          style={{ width: '100%', background: 'none', border: 'none', padding: '10px 12px', color: '#F5F5F5', fontSize: 14, textAlign: 'left', cursor: 'pointer', borderRadius: 8 }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#1E1630')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                          {name}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => setShowAddEx(false)}
                      style={{ width: '100%', background: '#1E1630', border: 'none', borderRadius: 8, padding: '10px', color: '#888', cursor: 'pointer', marginTop: 8 }}>Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setShowAddEx(true)}
                    style={{ width: '100%', background: '#130F1F', border: `2px dashed #2A1F40`, borderRadius: 12, padding: '13px', color: ACCENT, fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Plus size={16} /> Add Exercise
                  </button>
                )}
              </>
            )}
          </>
        )}

        {tab === 'history' && (
          <>
            <div style={{ fontSize: 14, color: '#888', marginBottom: 16 }}>Workout history</div>
            {sessions.length === 0 && <div style={{ textAlign: 'center', color: '#444', padding: '40px 0', fontSize: 14 }}>No workouts logged yet</div>}
            {sessions.map(s => (
              <div key={s.id} style={{ background: '#130F1F', borderRadius: 14, padding: '14px 16px', marginBottom: 10, border: '1px solid #2A1F40' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>{s.date} · {s.duration}min</div>
                  </div>
                  <div style={{ fontSize: 13, color: ACCENT, fontWeight: 600 }}>{s.exercises.length} exercises</div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {s.exercises.map(ex => (
                    <span key={ex.id} style={{ background: '#1E1630', borderRadius: 6, padding: '3px 8px', fontSize: 11, color: '#999' }}>
                      {ex.name} · {ex.sets.length}×{Math.max(...ex.sets.map(st => st.reps))}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}

        {tab === 'stats' && (
          <>
            <div style={{ fontSize: 14, color: '#888', marginBottom: 16 }}>Personal Records</div>
            <div style={{ background: '#130F1F', borderRadius: 14, padding: 16, marginBottom: 16, border: '1px solid #2A1F40' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  ['Total Sessions', sessions.length],
                  ['Total Exercises', sessions.reduce((s, w) => s + w.exercises.length, 0)],
                  ['Total Sets', sessions.reduce((s, w) => s + w.exercises.reduce((a, e) => a + e.sets.length, 0), 0)],
                  ['Avg Duration', sessions.length ? Math.round(sessions.reduce((s, w) => s + w.duration, 0) / sessions.length) + 'min' : '—'],
                ].map(([label, val]) => (
                  <div key={label as string} style={{ textAlign: 'center', padding: 12, background: '#1E1630', borderRadius: 10 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: ACCENT }}>{val}</div>
                    <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 10, fontWeight: 600 }}>PERSONAL RECORDS</div>
            {Object.entries(prs).sort((a, b) => b[1].weight - a[1].weight).map(([name, pr]) => (
              <div key={name} style={{ background: '#130F1F', borderRadius: 12, padding: '12px 16px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #2A1F40' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{name}</div>
                  <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{pr.date}</div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: ACCENT }}>{pr.weight} {unit}</div>
              </div>
            ))}
            {Object.keys(prs).length === 0 && <div style={{ textAlign: 'center', color: '#444', padding: '30px 0', fontSize: 14 }}>Log workouts to see records</div>}
          </>
        )}
      </div>
    </div>
  )
}
