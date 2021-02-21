import * as core from '@actions/core';
import { RunMeta, TestMeta } from './ts/meta.ts';

class ReportConverter {
  static convertReport(filename, report) {
    core.info(`Start analyzing report: ${filename}`);
    core.debug(JSON.stringify(report));
    const run = report['test-run'];
    const meta = new RunMeta(filename);

    meta.total = Number(run.total);
    meta.failed = Number(run.failed);
    meta.skipped = Number(run.skipped);
    meta.passed = Number(run.passed);
    meta.duration = Number(run.duration);

    meta.addTests(ReportConverter.convertSuite(run['test-suite']));

    return meta;
  }

  static convertSuite(suites) {
    if (Array.isArray(suites)) {
      const result = [];
      suites.array.forEach(suite => {
        result.concat(ReportConverter.convertSuite(suite));
      });
      return result;
    }

    core.debug(`Analyze suite ${suites.type} / ${suites.fullname}`);
    const result = [];
    const innerSuite = suites['test-suite'];
    if (innerSuite) {
      result.push(...ReportConverter.convertSuite(innerSuite, ReportConverter.convertTests));
    }

    const tests = suites['test-case'];
    if (tests) {
      result.push(...ReportConverter.convertTests(suites.fullname, tests));
    }

    return result;
  }

  static convertTests(suite, tests) {
    if (Array.isArray(tests)) {
      const result = [];
      tests.array.forEach(test => {
        result.concat(ReportConverter.convertTests(suite, test));
      });
      return result;
    }

    return [ReportConverter.convertTestCase(suite, tests)];
  }

  static convertTestCase(suite, testCase) {
    const { name, fullname, result, failure, duration } = testCase;
    const meta = new TestMeta(suite, name);
    meta.result = result;
    meta.duration = Number(duration);

    if (!failure) {
      core.isDebug(`Skip test ${fullname} without failure data`);
      return meta;
    }

    core.debug(`Convert data for test ${fullname}`);
    if (failure['stack-trace'] === undefined) {
      core.warning(`No stack trace for test case: ${fullname}`);
      return meta;
    }

    const trace = failure['stack-trace'].cdata;
    const point = ReportConverter.findAnnotationPoint(trace);
    if (point === undefined) {
      core.warning('Not able to find entry point for failed test! Test trace:');
      core.warning(trace);
      return meta;
    }

    meta.annotation = {
      path: point.path,
      start_line: point.line,
      end_line: point.line,
      annotation_level: 'failure',
      title: fullname,
      message: failure.message.cdata,
      raw_details: trace,
    };
    core.info(`- ${meta.annotation.path}:${meta.annotation.start_line} - ${meta.annotation.title}`);
    return meta;
  }

  static findAnnotationPoint(trace) {
    const match = trace.match(/at .* in ((?<path>[^:]+):(?<line>\d+))/);
    return {
      path: match.groups.path,
      line: Number(match.groups.line),
    };
  }
}

export default ReportConverter;
