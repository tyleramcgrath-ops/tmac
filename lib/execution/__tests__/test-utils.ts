/**
 * Simple test utilities for execution tests
 */

export interface TestResult {
  name: string
  passed: boolean
  error?: string
  duration: number
}

export class TestSuite {
  private tests: Array<{ name: string; fn: () => Promise<void> | void }> = []
  private results: TestResult[] = []
  private suiteName: string

  constructor(name: string) {
    this.suiteName = name
  }

  describe(name: string, fn: () => void) {
    console.log(`\n📋 ${name}`)
    fn()
  }

  it(name: string, fn: () => Promise<void> | void) {
    this.tests.push({ name, fn })
  }

  async run(): Promise<TestResult[]> {
    console.log(`\n${'='.repeat(70)}`)
    console.log(`🧪 TEST SUITE: ${this.suiteName}`)
    console.log(`${'='.repeat(70)}`)

    for (const test of this.tests) {
      const startTime = performance.now()
      try {
        await test.fn()
        const duration = performance.now() - startTime
        this.results.push({ name: test.name, passed: true, duration })
        console.log(`✅ ${test.name} (${duration.toFixed(0)}ms)`)
      } catch (error) {
        const duration = performance.now() - startTime
        this.results.push({
          name: test.name,
          passed: false,
          error: error instanceof Error ? error.message : String(error),
          duration,
        })
        console.log(`❌ ${test.name} (${duration.toFixed(0)}ms)`)
        console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    // Print summary
    const passed = this.results.filter((r) => r.passed).length
    const failed = this.results.filter((r) => !r.passed).length
    const totalTime = this.results.reduce((acc, r) => acc + r.duration, 0)

    console.log(`\n${'─'.repeat(70)}`)
    console.log(`Results: ${passed} passed, ${failed} failed (${totalTime.toFixed(0)}ms total)`)
    console.log(`${'─'.repeat(70)}\n`)

    return this.results
  }
}

export function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`)
  }
}

export function assertEqual<T>(actual: T, expected: T, message?: string) {
  if (actual !== expected) {
    throw new Error(
      message || `Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`
    )
  }
}

export function assertDefined<T>(value: T, message?: string): asserts value is NonNullable<T> {
  if (value === null || value === undefined) {
    throw new Error(message || `Expected value to be defined`)
  }
}
