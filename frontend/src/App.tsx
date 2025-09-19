import React, { useEffect, useState, useCallback } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

interface NutritionData {
  foods: Array<{
    food_name: string
    nf_calories: number
    [key: string]: unknown
  }>
}

interface Habit {
  name: string
  notes: string
  createdAt: string
  [key: string]: unknown
}

interface HabiticaTask {
  id: string
  text: string
  type: string
  [key: string]: unknown
}

export default function App() {
  const [food, setFood] = useState('banana')
  const [data, setData] = useState<NutritionData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [habits, setHabits] = useState<Habit[]>([])
  const [habitName, setHabitName] = useState('New Habit')
  const [apiHealth, setApiHealth] = useState<string>('unknown')
  const [dbHealth, setDbHealth] = useState<string>('unknown')
  const [htasks, setHtasks] = useState<HabiticaTask[]>([])
  const [selectedTaskId, setSelectedTaskId] = useState<string>('')

  const fetchNutrition = useCallback(async () => {
    setLoading(true)
    setError(null)
    setData(null)
    try {
      const res = await fetch(`${API_BASE}/api/nutrition?food=${encodeURIComponent(food)}`)
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(`${res.status} ${txt}`)
      }
      const json = await res.json()
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [food])

  useEffect(() => {
    // initial load
    fetchNutrition()
  }, [fetchNutrition])

  const loadHabits = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/habits`)
      if (!res.ok) throw new Error(await res.text())
      setHabits(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const createHabit = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/habits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: habitName }),
      })
      if (!res.ok) throw new Error(await res.text())
      await loadHabits()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const checkApi = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/health`)
      setApiHealth(res.ok ? 'ok' : `bad (${res.status})`)
    } catch {
      setApiHealth('unreachable')
    }
  }

  const checkDb = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/db/health`)
      setDbHealth(res.ok ? 'ok' : `bad (${res.status})`)
    } catch {
      setDbHealth('unreachable')
    }
  }

  const loadHabitica = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/habitica/tasks?type=habits`)
      if (!res.ok) throw new Error(await res.text())
      const json = await res.json()
      // Habitica returns { success: true, data: [...] }
      const list = Array.isArray(json?.data) ? json.data : []
      setHtasks(list)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const scoreHabitica = async (direction: 'up' | 'down') => {
    if (!selectedTaskId) {
      setError('Select a Habitica taskId first')
      return
    }
    try {
      const res = await fetch(`${API_BASE}/api/habitica/tasks/${selectedTaskId}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction }),
      })
      if (!res.ok) throw new Error(await res.text())
      await loadHabitica()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>ShowUp Nutrition (React)</h1>
      <div>
  <input value={food} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFood(e.target.value)} placeholder="e.g., banana" />
        <button onClick={fetchNutrition} disabled={loading}>Fetch</button>
      </div>
      {loading && <p>Loading...</p>}
      {error && <pre style={{ color: 'crimson', whiteSpace: 'pre-wrap' }}>{error}</pre>}
      {data && (
        <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(data, null, 2)}</pre>
      )}

      <hr />
      <h2>API Status</h2>
      <div>
        <button onClick={checkApi}>Check /api/health</button> <span>{apiHealth}</span>
      </div>
      <div>
        <button onClick={checkDb}>Check /api/db/health</button> <span>{dbHealth}</span>
      </div>

      <hr />
      <h2>Habits (Python API + Mongo)</h2>
      <div>
        <button onClick={loadHabits}>Load Habits</button>
  <input value={habitName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHabitName(e.target.value)} />
        <button onClick={createHabit}>Create Habit</button>
      </div>
      {habits.length > 0 && (
        <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(habits, null, 2)}</pre>
      )}

      <hr />
      <h2>Habitica (proxy via API)</h2>
      <div>
        <button onClick={loadHabitica}>Load Habitica Habits</button>
        {htasks.length > 0 ? (
          <select value={selectedTaskId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedTaskId(e.target.value)}>
            <option value="">Select a task</option>
            {htasks.map((t) => (
              <option key={t.id} value={t.id}>{t.text || t.id}</option>
            ))}
          </select>
        ) : (
          <p>No Habitica tasks loaded</p>
        )}
        <button onClick={() => scoreHabitica('up')}>Score ↑</button>
        <button onClick={() => scoreHabitica('down')}>Score ↓</button>
      </div>
    </div>
  )
}