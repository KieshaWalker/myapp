import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

function App() {
  const [food, setFood] = useState('banana')
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [habits, setHabits] = useState<any[]>([])
  const [habitName, setHabitName] = useState('New Habit')
  const [apiHealth, setApiHealth] = useState<string>('unknown')
  const [dbHealth, setDbHealth] = useState<string>('unknown')

  const fetchNutrition = async () => {
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
    } catch (e: any) {
      setError(e.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // initial load
    fetchNutrition()
  }, [])

  const loadHabits = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/habits`)
      if (!res.ok) throw new Error(await res.text())
      setHabits(await res.json())
    } catch (e: any) {
      setError(e.message)
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
    } catch (e: any) {
      setError(e.message)
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

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>ShowUp Nutrition (React)</h1>
      <div>
        <input value={food} onChange={(e) => setFood(e.target.value)} placeholder="e.g., banana" />
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
        <input value={habitName} onChange={(e) => setHabitName(e.target.value)} />
        <button onClick={createHabit}>Create Habit</button>
      </div>
      {habits.length > 0 && (
        <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(habits, null, 2)}</pre>
      )}
    </div>
  )
}

const root = createRoot(document.getElementById('root')!)
root.render(<App />)
