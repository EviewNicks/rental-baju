// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');

/**
 * Reporter JSON khusus untuk CI/CD dengan format berbeda
 * File ini digunakan oleh GitHub Actions untuk mengumpulkan dan melaporkan hasil test
 */
class DetailedJsonReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
    this.resultData = {
      numTotalTests: 0,
      numPassedTests: 0,
      numFailedTests: 0,
      numPendingTests: 0,
      startTime: new Date(),
      endTime: null,
      testResults: [],
    };
  }

  onRunComplete(contexts, results) {
    this.resultData.endTime = new Date();
    this.resultData.numTotalTests = results.numTotalTests;
    this.resultData.numPassedTests = results.numPassedTests;
    this.resultData.numFailedTests = results.numFailedTests;
    this.resultData.numPendingTests = results.numPendingTests;
    this.resultData.testResults = results.testResults.map((testResult) => ({
      testFilePath: testResult.testFilePath,
      testFileResults: testResult.testResults.map((assertionResult) => ({
        ancestorTitles: assertionResult.ancestorTitles,
        fullName: assertionResult.fullName,
        status: assertionResult.status,
        title: assertionResult.title,
        failureMessages: assertionResult.failureMessages,
        duration: assertionResult.duration,
      })),
      failureMessage: testResult.failureMessage || null,
    }));

    // Membuat format JSON untuk GitHub Actions
    const jsonResult = JSON.stringify(this.resultData, null, 2);

    // Menyimpan hasil ke konsol atau file
    console.log(
      '[DetailedJsonReporter]',
      `Total: ${results.numTotalTests}, Passed: ${results.numPassedTests}, Failed: ${results.numFailedTests}`,
    );

    // Jika dalam GitHub Actions, tambahkan summary
    if (process.env.GITHUB_ACTIONS) {
      console.log('::set-output name=test_total::' + results.numTotalTests);
      console.log('::set-output name=test_passed::' + results.numPassedTests);
      console.log('::set-output name=test_failed::' + results.numFailedTests);
    }

    // Menyimpan file report
    const outputDir = path.resolve(process.cwd(), 'services/detailed-report');

    try {
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      fs.writeFileSync(path.resolve(outputDir, 'test-report.json'), jsonResult);
    } catch (error) {
      console.error('Failed to write test results to file:', error);
    }
  }
}

module.exports = DetailedJsonReporter;
