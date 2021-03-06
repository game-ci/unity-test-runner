import * as core from '@actions/core';
import * as xmljs from 'xml-js';
import * as fs from 'fs';
import path from 'path';
import { RunMeta, TestMeta } from './ts/results-meta.ts';

class ResultsParser {
  static async parseResults(filepath) {
    if (!fs.existsSync(filepath)) {
      throw new Error(`Missing file! {"filepath": "${filepath}"}`);
    }

    core.info(`Trying to open ${filepath}`);
    const file = await fs.promises.readFile(filepath, 'utf8');
    const results = xmljs.xml2js(file, { compact: true });
    core.info(`File ${filepath} parsed...`);

    return ResultsParser.convertResults(path.basename(filepath), results);
  }

  static convertResults(filename, filedata) {
    core.info(`Start analyzing results: ${filename}`);

    const run = filedata['test-run'];
    const runMeta = new RunMeta(filename);
    const tests = ResultsParser.convertSuite(run['test-suite']);
    core.debug(tests);

    runMeta.total = Number(run._attributes.total);
    runMeta.failed = Number(run._attributes.failed);
    runMeta.skipped = Number(run._attributes.skipped);
    runMeta.passed = Number(run._attributes.passed);
    runMeta.duration = Number(run._attributes.duration);
    runMeta.addTests(tests);

    return runMeta;
  }

  static convertSuite(suites) {
    if (Array.isArray(suites)) {
      const innerResult = [];
      suites.forEach(suite => {
        innerResult.push(...ResultsParser.convertSuite(suite));
      });
      return innerResult;
    }

    const result = [];
    const innerSuite = suites['test-suite'];
    if (innerSuite) {
      result.push(...ResultsParser.convertSuite(innerSuite));
    }

    const tests = suites['test-case'];
    if (tests) {
      result.push(...ResultsParser.convertTests(suites._attributes.fullname, tests));
    }

    return result;
  }

  static convertTests(suite, tests) {
    if (Array.isArray(tests)) {
      const result = [];
      tests.forEach(test => {
        result.push(ResultsParser.convertTestCase(suite, test));
      });
      return result;
    }

    return [ResultsParser.convertTestCase(suite, tests)];
  }

  static convertTestCase(suite, testCase) {
    const { _attributes, failure } = testCase;
    const { name, fullname, result, duration } = _attributes;
    const testMeta = new TestMeta(suite, name);
    testMeta.result = result;
    testMeta.duration = Number(duration);

    if (!failure) {
      core.debug(`Skip test ${fullname} without failure data`);
      return testMeta;
    }

    core.debug(`Convert data for test ${fullname}`);
    if (failure['stack-trace'] === undefined) {
      core.warning(`No stack trace for test case: ${fullname}`);
      return testMeta;
    }

    const trace = failure['stack-trace']._cdata;
    const point = ResultsParser.findAnnotationPoint(trace);
    if (!point.path || !point.line) {
      core.warning(`Not able to find annotation point for failed test! Test trace: ${trace}`);
      return testMeta;
    }

    testMeta.annotation = {
      path: point.path,
      start_line: point.line,
      end_line: point.line,
      annotation_level: 'failure',
      title: fullname,
      message: failure.message._cdata,
      raw_details: trace,
    };
    core.info(
      `- ${testMeta.annotation.path}:${testMeta.annotation.start_line} - ${testMeta.annotation.title}`,
    );
    return testMeta;
  }

  static findAnnotationPoint(trace) {
    const match = trace.match(/at .* in ((?<path>[^:]+):(?<line>\d+))/);
    return {
      path: match ? match.groups.path : '',
      line: match ? Number(match.groups.line) : 0,
    };
  }
}

export default ResultsParser;
