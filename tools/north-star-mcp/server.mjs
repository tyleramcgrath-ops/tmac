#!/usr/bin/env node
// North Star -> Hermes bridge.
//
// Exposes North Star's read API to the Compass's agent as MCP tools, so
// "how is visibility trending" makes it read the data instead of inventing an
// answer. Read-only by design: nothing here can execute an operator action,
// approve a recommendation, or change a mission. Those exist as routes, but
// giving an agent write access to a live account is a decision to make
// deliberately, not to inherit from a bridge that started out read-only.
//
// Talks to the real routes rather than the database, so every engine
// composition (coordinateProject, buildExecutiveBrief, ...) stays in one
// place and cannot drift.
//
// Setup:
//   NORTH_STAR_URL   base URL (default http://localhost:3100)
//   AGENT_SECRET     must match AGENT_SECRET in North Star's env
//
//   hermes mcp add north-star -- node /path/to/server.mjs

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const BASE = (process.env.NORTH_STAR_URL || 'http://localhost:3100').replace(/\/+$/, '')
const SECRET = process.env.AGENT_SECRET || ''

// A single brief can compose nine sources and run to hundreds of kilobytes.
// Handing that to the model verbatim would blow the context window and cost a
// fortune per turn, so responses are capped and the truncation is stated
// rather than silent — a model that cannot see the cut will happily summarise
// the half it received as if it were the whole.
const MAX_CHARS = 12_000

async function get(path) {
  if (!SECRET) {
    return { error: 'AGENT_SECRET is not set for this MCP server, so North Star will reject every call.' }
  }
  let res
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: { Authorization: `Bearer ${SECRET}`, Accept: 'application/json' },
    })
  } catch (err) {
    return {
      error: `Could not reach North Star at ${BASE} (${err?.message ?? 'unknown'}). ` +
        `If North Star runs on a laptop and this agent runs elsewhere, the reverse tunnel is probably down.`,
    }
  }
  const body = await res.text()
  if (!res.ok) {
    return { error: `North Star returned ${res.status}: ${body.slice(0, 300)}` }
  }
  try {
    return JSON.parse(body)
  } catch {
    return { error: `North Star returned non-JSON: ${body.slice(0, 300)}` }
  }
}

function reply(data) {
  let text = JSON.stringify(data, null, 2)
  if (text.length > MAX_CHARS) {
    text = text.slice(0, MAX_CHARS) +
      `\n\n[TRUNCATED at ${MAX_CHARS} characters. This is a partial response — ` +
      `say so if you summarise it, and narrow the question to see the rest.]`
  }
  return { content: [{ type: 'text', text }] }
}

const server = new McpServer({ name: 'north-star', version: '0.1.0' })

const projectArg = {
  projectId: z.string().describe('North Star project id, from north_star_projects'),
}

server.registerTool('north_star_projects', {
  title: 'List North Star projects',
  description:
    'Every site tracked in North Star, with id and domain. Call this first — the other tools need a projectId.',
  inputSchema: {},
}, async () => reply(await get('/api/projects')))

server.registerTool('north_star_brief', {
  title: 'Executive brief',
  description:
    'The executive brief for a project: the synthesised state of visibility, missions, agents, and what changed. ' +
    'The best single call for "how are we doing".',
  inputSchema: projectArg,
}, async ({ projectId }) => reply(await get(`/api/projects/${projectId}/brief`)))

server.registerTool('north_star_recommendations', {
  title: 'Recommendations',
  description:
    'Open recommendations with agent stances, consensus, and provenance. Use for "what should I fix" and ' +
    '"why is this recommended".',
  inputSchema: projectArg,
}, async ({ projectId }) => reply(await get(`/api/projects/${projectId}/recommendations`)))

server.registerTool('north_star_analytics', {
  title: 'Analytics',
  description:
    'Visibility analytics. kind="trend" for movement over time, kind="breakdown" for the current split. ' +
    'Use for "how is it trending" and "where are we losing ground".',
  inputSchema: {
    ...projectArg,
    kind: z.enum(['trend', 'breakdown']).describe('trend = over time, breakdown = current composition'),
  },
}, async ({ projectId, kind }) => reply(await get(`/api/projects/${projectId}/analytics/${kind}`)))

server.registerTool('north_star_missions', {
  title: 'Missions',
  description: 'The mission queue: what is planned, running, and finished for a project.',
  inputSchema: projectArg,
}, async ({ projectId }) => reply(await get(`/api/projects/${projectId}/missions`)))

server.registerTool('north_star_activity', {
  title: 'Activity stream',
  description:
    'Recent activity events for a project — approvals, deployments, verifications, mission changes. ' +
    'Use for "what happened overnight".',
  inputSchema: {
    ...projectArg,
    limit: z.number().int().min(1).max(100).optional().describe('how many events (default 25)'),
  },
}, async ({ projectId, limit }) =>
  reply(await get(`/api/projects/${projectId}/activity?limit=${limit ?? 25}`)))

server.registerTool('north_star_roster', {
  title: 'Agent roster',
  description: 'The multi-agent roster and each agent\'s current status for a project.',
  inputSchema: projectArg,
}, async ({ projectId }) => reply(await get(`/api/projects/${projectId}/agents/roster`)))

await server.connect(new StdioServerTransport())
