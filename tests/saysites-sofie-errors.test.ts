import Anthropic from '@anthropic-ai/sdk'
import { describe, expect, it } from 'vitest'
import { describeSofieError, sofieErrorText } from '../apps/saysites/lib/sofie-errors'

const api = (status: number, message: string) => Anthropic.APIError.generate(status, { type: 'error', error: { type: 'x', message } }, message, new Headers())

describe('SaySites: why Sofie could not finish', () => {
  it('names the setup problem for the team, plainly for owners', () => {
    expect(describeSofieError(api(401, 'invalid x-api-key')).team).toMatch(/ANTHROPIC_API_KEY/)
    expect(describeSofieError(api(400, 'Your credit balance is too low to access the Anthropic API.')).team).toMatch(/out of credit/)
    expect(describeSofieError(api(400, 'This API key is not scoped to a workspace, so this request must include the anthropic-workspace-id header')).team).toMatch(/Default workspace/)
    expect(describeSofieError(api(429, 'rate_limit_error')).owner).toMatch(/busy/)
    expect(describeSofieError(api(529, 'Overloaded')).owner).toMatch(/overloaded/)
    expect(describeSofieError(new Error('fetch failed')).owner).toMatch(/couldn’t reach/)
  })

  it('only shows the technical reason to the team', () => {
    const e = api(401, 'invalid x-api-key')
    expect(sofieErrorText(e, false)).not.toMatch(/For the team|ANTHROPIC_API_KEY/)
    expect(sofieErrorText(e, true)).toMatch(/For the team: .*ANTHROPIC_API_KEY/)
  })
})
