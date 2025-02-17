export async function runTestSuite(testFn: () => Promise<void>) {
  try {
    const results = await testFn()
    return {
      success: true,
      results: formatTestResults(results),
      passed: results.failed === 0,
    }
  } catch (error) {
    return {
      success: false,
      error: `Test Error: ${error instanceof Error && error.message}`,
    }
  }
}

type Results = {
  total: number
  passed: number
  failed: number
  details: Array<
    { name: string; status: string; error?: string }
  >
}

function formatTestResults(results: Results) {
  let output = `Test Results:
• Total Tests: ${results.total}
• Passed: ${results.passed}
• Failed: ${results.failed}\n\nDetailed Results:`

  results.details.forEach((test) => {
    output += `\n• ${test.name}: ${test.status}`
    if (test.error) {
      output += `\n  Error: ${test.error}`
    }
  })

  return output
}
