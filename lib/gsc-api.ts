// Google Search Console API client

export interface GSCMetric {
  keys: [string] // [query] or [page] or [device] or [country]
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface GSCQuery {
  query: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface GSCDevice {
  device: string // DESKTOP, MOBILE, TABLET
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface GSCCountry {
  country: string // ISO country code
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export async function fetchGSCMetrics(
  siteUrl: string,
  accessToken: string,
  startDate: string,
  endDate: string,
  dimensionFilter?: { dimension: string; operator: string; expression: string }[]
): Promise<GSCMetric[]> {
  const body: Record<string, unknown> = {
    startDate,
    endDate,
    dimensions: ['query'],
    rowLimit: 25000,
  }

  if (dimensionFilter) {
    body.dimensionFilterGroups = [{ filters: dimensionFilter }]
  }

  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`GSC API error: ${res.status} ${err}`)
  }

  const data = (await res.json()) as { rows?: GSCMetric[] }
  return data.rows || []
}

export async function fetchGSCQueriesForPage(
  siteUrl: string,
  accessToken: string,
  page: string,
  startDate: string,
  endDate: string
): Promise<GSCQuery[]> {
  const body = {
    startDate,
    endDate,
    dimensions: ['query'],
    dimensionFilterGroups: [
      {
        filters: [
          {
            dimension: 'page',
            operator: 'EQUALS',
            expression: page,
          },
        ],
      },
    ],
    rowLimit: 1000,
  }

  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`GSC API error: ${res.status} ${err}`)
  }

  interface GSCRow {
    keys: string[]
    clicks: number
    impressions: number
    ctr: number
    position: number
  }

  const data = (await res.json()) as { rows?: GSCRow[] }
  return (data.rows || []).map((row) => ({
    query: row.keys[0],
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: row.ctr,
    position: row.position,
  }))
}

export async function fetchGSCPageMetrics(
  siteUrl: string,
  accessToken: string,
  startDate: string,
  endDate: string
): Promise<Array<{ page: string; clicks: number; impressions: number; ctr: number; position: number }>> {
  const body = {
    startDate,
    endDate,
    dimensions: ['page'],
    rowLimit: 25000,
  }

  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`GSC API error: ${res.status} ${err}`)
  }

  interface GSCPageRow {
    keys: [string]
    clicks: number
    impressions: number
    ctr: number
    position: number
  }

  const data = (await res.json()) as { rows?: GSCPageRow[] }
  return (data.rows || []).map((row) => ({
    page: row.keys[0],
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: row.ctr,
    position: row.position,
  }))
}

export async function fetchGSCDeviceMetrics(
  siteUrl: string,
  accessToken: string,
  startDate: string,
  endDate: string
): Promise<GSCDevice[]> {
  const body = {
    startDate,
    endDate,
    dimensions: ['device'],
    rowLimit: 10,
  }

  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`GSC API error: ${res.status} ${err}`)
  }

  interface GSCDeviceRow {
    keys: [string]
    clicks: number
    impressions: number
    ctr: number
    position: number
  }

  const data = (await res.json()) as { rows?: GSCDeviceRow[] }
  return (data.rows || []).map((row) => ({
    device: row.keys[0],
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: row.ctr,
    position: row.position,
  }))
}

export async function fetchGSCCountryMetrics(
  siteUrl: string,
  accessToken: string,
  startDate: string,
  endDate: string
): Promise<GSCCountry[]> {
  const body = {
    startDate,
    endDate,
    dimensions: ['country'],
    rowLimit: 250,
  }

  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`GSC API error: ${res.status} ${err}`)
  }

  interface GSCCountryRow {
    keys: [string]
    clicks: number
    impressions: number
    ctr: number
    position: number
  }

  const data = (await res.json()) as { rows?: GSCCountryRow[] }
  return (data.rows || []).map((row) => ({
    country: row.keys[0],
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: row.ctr,
    position: row.position,
  }))
}

export async function getGSCProperties(accessToken: string): Promise<string[]> {
  const res = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`GSC API error: ${res.status} ${err}`)
  }

  interface Site {
    siteUrl: string
  }

  interface GSCResponse {
    siteEntry?: Site[]
  }

  const data = (await res.json()) as GSCResponse
  return (data.siteEntry || []).map((site) => site.siteUrl)
}
