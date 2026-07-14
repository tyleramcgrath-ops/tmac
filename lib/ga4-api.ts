// Google Analytics 4 Data API client

export interface GA4Metric {
  dimensionValues: Array<{ value: string }>
  metricValues: Array<{ value: string }>
}

export interface GA4LandingPageMetric {
  page: string
  sessions: number
  users: number
  engagementRate: number
  conversions: number
  revenue: number
}

export interface GA4PageMetric {
  page: string
  users: number
  sessions: number
  engagementRate: number
  bounceRate: number
  avgSessionDuration: number
  conversions: number
  conversionRate: number
  revenue?: number
}

export async function fetchGA4Report(
  propertyId: string,
  accessToken: string,
  dimensions: string[],
  metrics: string[],
  startDate: string,
  endDate: string,
  limit: number = 10000
): Promise<GA4Metric[]> {
  const body = {
    dateRanges: [{ startDate, endDate }],
    dimensions: dimensions.map((d) => ({ name: d })),
    metrics: metrics.map((m) => ({ name: m })),
    limit,
  }

  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`GA4 API error: ${res.status} ${err}`)
  }

  interface GA4Response {
    rows?: GA4Metric[]
  }

  const data = (await res.json()) as GA4Response
  return data.rows || []
}

export async function fetchGA4OrganicSessionsByPage(
  propertyId: string,
  accessToken: string,
  startDate: string,
  endDate: string
): Promise<GA4LandingPageMetric[]> {
  const body = {
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'landingPage' }],
    metrics: [
      { name: 'sessions' },
      { name: 'users' },
      { name: 'engagementRate' },
      { name: 'conversions' },
      { name: 'ecommerceRevenue' },
    ],
    dimensionFilter: {
      filter: {
        fieldName: 'sessionDefaultChannelGroup',
        stringFilter: {
          matchType: 'EXACT',
          value: 'Organic Search',
        },
      },
    },
    limit: 10000,
  }

  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`GA4 API error: ${res.status} ${err}`)
  }

  interface GA4Response {
    rows?: Array<{
      dimensionValues: Array<{ value: string }>
      metricValues: Array<{ value: string }>
    }>
  }

  const data = (await res.json()) as GA4Response
  return (data.rows || []).map((row) => ({
    page: row.dimensionValues[0]?.value || '',
    sessions: parseInt(row.metricValues[0]?.value || '0', 10),
    users: parseInt(row.metricValues[1]?.value || '0', 10),
    engagementRate: parseFloat(row.metricValues[2]?.value || '0'),
    conversions: parseInt(row.metricValues[3]?.value || '0', 10),
    revenue: parseFloat(row.metricValues[4]?.value || '0'),
  }))
}

export async function fetchGA4PageMetrics(
  propertyId: string,
  accessToken: string,
  startDate: string,
  endDate: string
): Promise<GA4PageMetric[]> {
  const body = {
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [
      { name: 'users' },
      { name: 'sessions' },
      { name: 'engagementRate' },
      { name: 'bounceRate' },
      { name: 'averageSessionDuration' },
      { name: 'conversions' },
      { name: 'conversionRate' },
    ],
    dimensionFilter: {
      filter: {
        fieldName: 'sessionDefaultChannelGroup',
        stringFilter: {
          matchType: 'EXACT',
          value: 'Organic Search',
        },
      },
    },
    limit: 10000,
  }

  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`GA4 API error: ${res.status} ${err}`)
  }

  interface GA4Response {
    rows?: Array<{
      dimensionValues: Array<{ value: string }>
      metricValues: Array<{ value: string }>
    }>
  }

  const data = (await res.json()) as GA4Response
  return (data.rows || []).map((row) => ({
    page: row.dimensionValues[0]?.value || '',
    users: parseInt(row.metricValues[0]?.value || '0', 10),
    sessions: parseInt(row.metricValues[1]?.value || '0', 10),
    engagementRate: parseFloat(row.metricValues[2]?.value || '0'),
    bounceRate: parseFloat(row.metricValues[3]?.value || '0'),
    avgSessionDuration: parseFloat(row.metricValues[4]?.value || '0'),
    conversions: parseInt(row.metricValues[5]?.value || '0', 10),
    conversionRate: parseFloat(row.metricValues[6]?.value || '0'),
  }))
}

export async function getGA4Properties(accessToken: string): Promise<Array<{ id: string; displayName: string }>> {
  const res = await fetch('https://analyticsadmin.googleapis.com/v1beta/accounts/-/properties', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`GA4 Admin API error: ${res.status} ${err}`)
  }

  interface GA4AdminResponse {
    properties?: Array<{
      name: string
      displayName: string
    }>
  }

  const data = (await res.json()) as GA4AdminResponse

  return (data.properties || []).map((prop) => {
    const match = prop.name.match(/properties\/(\d+)/)
    return {
      id: match ? match[1] : '',
      displayName: prop.displayName,
    }
  })
}
