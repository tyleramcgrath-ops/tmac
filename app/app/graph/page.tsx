'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

interface GraphNode {
  id: string
  label: string
  type: string
  url?: string | null
  isCore: boolean
  coreReason?: string | null
  frequency: number
  score: number
  properties?: unknown
}
interface GraphEdge {
  id: string
  from: string
  to: string
  type: string
  confidence: number
  strength: number
  evidence?: unknown
  source: string
  detectedAt: string
}
interface GraphResponse {
  success: boolean
  nodes: GraphNode[]
  edges: GraphEdge[]
}

const NODE_COLORS: Record<string, string> = {
  page: '#60a5fa',
  money_page: '#f59e0b',
  topic: '#34d399',
  entity: '#a78bfa',
  service: '#f87171',
  product: '#fb7185',
  location: '#38bdf8',
  category: '#facc15',
  faq: '#c084fc',
  author: '#fbbf24',
  schema_type: '#94a3b8',
  business_objective: '#f472b6',
}

const ALL_NODE_TYPES = Object.keys(NODE_COLORS)

interface Positioned extends GraphNode {
  x: number
  y: number
  vx: number
  vy: number
}

export default function GraphExplorerPage() {
  const [projectId, setProjectId] = useState('')
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [edges, setEdges] = useState<GraphEdge[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<Set<string>>(new Set(ALL_NODE_TYPES))

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem('rankforge:projectId')
    const fromUrl = new URLSearchParams(window.location.search).get('projectId')
    setProjectId(fromUrl || stored || '')
  }, [])

  const loadGraph = async () => {
    if (!projectId) {
      setError('Enter a projectId to load its graph.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ projectId, limit: '500' })
      const activeTypes = Array.from(typeFilter)
      if (activeTypes.length && activeTypes.length < ALL_NODE_TYPES.length) {
        params.set('nodeType', activeTypes.join(','))
      }
      const res = await fetch(`/api/rankforge/graph/data?${params}`)
      const data = (await res.json()) as GraphResponse & { error?: string }
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load graph')
      setNodes(data.nodes)
      setEdges(data.edges)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('rankforge:projectId', projectId)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load graph')
    } finally {
      setLoading(false)
    }
  }

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  )
  const relatedEdges = useMemo(
    () => (selectedNodeId ? edges.filter((e) => e.from === selectedNodeId || e.to === selectedNodeId) : []),
    [edges, selectedNodeId],
  )

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 340px', height: '100vh', color: '#e5e7eb', background: '#0b1220' }}>
      <aside style={{ padding: 16, borderRight: '1px solid #1f2937', overflowY: 'auto' }}>
        <h1 style={{ fontSize: 18, marginBottom: 12 }}>Knowledge Graph</h1>
        <label style={{ fontSize: 12, opacity: 0.7 }}>Project ID</label>
        <input
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          placeholder="cln..."
          style={inputStyle}
        />
        <button onClick={loadGraph} disabled={loading} style={{ ...buttonStyle, marginTop: 8, width: '100%' }}>
          {loading ? 'Loading…' : 'Load graph'}
        </button>
        {error && <p style={{ color: '#f87171', fontSize: 12, marginTop: 8 }}>{error}</p>}

        <h2 style={{ fontSize: 13, marginTop: 20, marginBottom: 8, opacity: 0.7 }}>Node types</h2>
        {ALL_NODE_TYPES.map((t) => (
          <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, fontSize: 12 }}>
            <input
              type="checkbox"
              checked={typeFilter.has(t)}
              onChange={(e) => {
                const next = new Set(typeFilter)
                if (e.target.checked) next.add(t)
                else next.delete(t)
                setTypeFilter(next)
              }}
            />
            <span
              style={{
                display: 'inline-block',
                width: 10,
                height: 10,
                background: NODE_COLORS[t],
                borderRadius: 2,
              }}
            />
            {t}
          </label>
        ))}

        <div style={{ marginTop: 20, fontSize: 12, opacity: 0.6 }}>
          <div>Nodes: {nodes.length}</div>
          <div>Edges: {edges.length}</div>
        </div>
      </aside>

      <main style={{ position: 'relative', overflow: 'hidden' }}>
        <GraphCanvas
          nodes={nodes}
          edges={edges}
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
        />
      </main>

      <aside style={{ padding: 16, borderLeft: '1px solid #1f2937', overflowY: 'auto' }}>
        <h2 style={{ fontSize: 15, marginBottom: 8 }}>Inspector</h2>
        {selectedNode ? (
          <div>
            <div style={{ fontSize: 12, opacity: 0.6 }}>{selectedNode.type}</div>
            <div style={{ fontSize: 16, fontWeight: 600, wordBreak: 'break-word' }}>
              {selectedNode.label}
            </div>
            {selectedNode.url && (
              <a href={selectedNode.url} target="_blank" rel="noreferrer" style={{ color: '#60a5fa', fontSize: 12, wordBreak: 'break-all' }}>
                {selectedNode.url}
              </a>
            )}
            <div style={{ marginTop: 8, fontSize: 12 }}>
              <div>Score: {Math.round(selectedNode.score)}</div>
              <div>Frequency: {selectedNode.frequency}</div>
              {selectedNode.isCore && <div style={{ color: '#fbbf24' }}>★ Core: {selectedNode.coreReason}</div>}
            </div>

            <h3 style={{ marginTop: 16, fontSize: 13, opacity: 0.8 }}>Relationships ({relatedEdges.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {relatedEdges.slice(0, 40).map((e) => {
                const other = e.from === selectedNode.id ? e.to : e.from
                const otherNode = nodes.find((n) => n.id === other)
                const direction = e.from === selectedNode.id ? '→' : '←'
                return (
                  <button
                    key={e.id}
                    onClick={() => setSelectedNodeId(other)}
                    style={{
                      textAlign: 'left',
                      background: '#111827',
                      border: '1px solid #1f2937',
                      color: '#e5e7eb',
                      borderRadius: 6,
                      padding: 8,
                      cursor: 'pointer',
                      fontSize: 12,
                    }}
                  >
                    <div style={{ opacity: 0.6, fontSize: 11 }}>{e.type} ({e.confidence.toFixed(2)})</div>
                    <div>{direction} {otherNode ? otherNode.label : other}</div>
                  </button>
                )
              })}
            </div>

            {selectedNode.properties ? (
              <details style={{ marginTop: 16, fontSize: 11 }}>
                <summary style={{ cursor: 'pointer', opacity: 0.7 }}>Raw properties</summary>
                <pre style={{ background: '#0b1220', padding: 8, borderRadius: 4, overflowX: 'auto' }}>
                  {JSON.stringify(selectedNode.properties, null, 2)}
                </pre>
              </details>
            ) : null}
          </div>
        ) : (
          <p style={{ fontSize: 12, opacity: 0.6 }}>Click a node to inspect its relationships and evidence.</p>
        )}
      </aside>
    </div>
  )
}

function GraphCanvas({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
}: {
  nodes: GraphNode[]
  edges: GraphEdge[]
  selectedNodeId: string | null
  onSelectNode: (id: string) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const positionsRef = useRef<Map<string, Positioned>>(new Map())
  const frameRef = useRef<number | null>(null)
  const sizeRef = useRef({ w: 800, h: 600 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      sizeRef.current = { w: rect.width, h: rect.height }
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  // Initialize/update node positions when node set changes
  useEffect(() => {
    const { w, h } = sizeRef.current
    const positions = positionsRef.current
    const alive = new Set<string>()
    nodes.forEach((n, i) => {
      alive.add(n.id)
      if (!positions.has(n.id)) {
        const angle = (i / Math.max(nodes.length, 1)) * Math.PI * 2
        const radius = 100 + Math.random() * 200
        positions.set(n.id, {
          ...n,
          x: w / 2 + Math.cos(angle) * radius,
          y: h / 2 + Math.sin(angle) * radius,
          vx: 0,
          vy: 0,
        })
      } else {
        Object.assign(positions.get(n.id)!, n)
      }
    })
    for (const key of Array.from(positions.keys())) {
      if (!alive.has(key)) positions.delete(key)
    }
  }, [nodes])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const positions = positionsRef.current
    let running = true

    const step = () => {
      if (!running) return
      const { w, h } = sizeRef.current
      const positionArr = Array.from(positions.values())

      // Simple force simulation
      for (const a of positionArr) {
        a.vx *= 0.85
        a.vy *= 0.85
        // Repulsion
        for (const b of positionArr) {
          if (a === b) continue
          const dx = a.x - b.x
          const dy = a.y - b.y
          const distSq = dx * dx + dy * dy + 0.01
          const force = 800 / distSq
          a.vx += (dx / Math.sqrt(distSq)) * force
          a.vy += (dy / Math.sqrt(distSq)) * force
        }
        // Center gravity
        a.vx += (w / 2 - a.x) * 0.001
        a.vy += (h / 2 - a.y) * 0.001
      }

      // Edge springs
      for (const e of edges) {
        const from = positions.get(e.from)
        const to = positions.get(e.to)
        if (!from || !to) continue
        const dx = to.x - from.x
        const dy = to.y - from.y
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.01
        const desired = 90
        const diff = (dist - desired) * 0.01 * e.confidence
        const fx = (dx / dist) * diff
        const fy = (dy / dist) * diff
        from.vx += fx
        from.vy += fy
        to.vx -= fx
        to.vy -= fy
      }

      // Integrate
      for (const p of positionArr) {
        p.x += p.vx
        p.y += p.vy
        p.x = Math.max(20, Math.min(w - 20, p.x))
        p.y = Math.max(20, Math.min(h - 20, p.y))
      }

      // Render
      const dpr = window.devicePixelRatio
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      // edges
      for (const e of edges) {
        const from = positions.get(e.from)
        const to = positions.get(e.to)
        if (!from || !to) continue
        ctx.strokeStyle = `rgba(148, 163, 184, ${Math.min(e.confidence * 0.5 + 0.1, 0.6)})`
        ctx.lineWidth = e.type === 'PAGE_SUPPORTS_MONEY_PAGE' ? 1.5 : 0.7
        ctx.beginPath()
        ctx.moveTo(from.x, from.y)
        ctx.lineTo(to.x, to.y)
        ctx.stroke()
      }

      // nodes
      for (const n of positionArr) {
        const color = NODE_COLORS[n.type] || '#94a3b8'
        const radius = 4 + Math.min(Math.sqrt(n.frequency) * 1.5, 12) + (n.isCore ? 3 : 0)
        ctx.beginPath()
        ctx.arc(n.x, n.y, radius, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()
        if (n.id === selectedNodeId) {
          ctx.strokeStyle = '#fbbf24'
          ctx.lineWidth = 2
          ctx.stroke()
        }
      }

      frameRef.current = requestAnimationFrame(step)
    }
    frameRef.current = requestAnimationFrame(step)

    return () => {
      running = false
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [edges, nodes, selectedNodeId])

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    let closest: { id: string; dist: number } | null = null
    for (const p of positionsRef.current.values()) {
      const dx = x - p.x
      const dy = y - p.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (!closest || dist < closest.dist) closest = { id: p.id, dist }
    }
    if (closest && closest.dist < 20) onSelectNode(closest.id)
  }

  return <canvas ref={canvasRef} onClick={handleClick} style={{ width: '100%', height: '100%', display: 'block' }} />
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: 8,
  borderRadius: 6,
  background: '#111827',
  color: '#e5e7eb',
  border: '1px solid #1f2937',
  fontSize: 12,
  marginTop: 4,
}

const buttonStyle: React.CSSProperties = {
  background: '#2563eb',
  color: 'white',
  border: 'none',
  padding: '8px 12px',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 500,
}
