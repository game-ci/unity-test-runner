import * as core from '@actions/core';
import { RunMeta, TestMeta } from './ts/meta.ts';

class ReportConverter {
  static convertReport(filename, report) {
    core.info(`Start analyzing report: ${filename}`);
    core.debug(JSON.stringify(report));
    const run = report['test-run'];
    const meta = new RunMeta(filename);

    meta.total = Number(run._attributes.total);
    meta.failed = Number(run._attributes.failed);
    meta.skipped = Number(run._attributes.skipped);
    meta.passed = Number(run._attributes.passed);
    meta.duration = Number(run._attributes.duration);

    core.debug(`test-suite length ${run['test-suite'].length} and value ${run['test-suite']}`);
    meta.addTests(ReportConverter.convertSuite(run['test-suite']));
    core.debug(`meta length ${meta.suites.length}`);

    return meta;
  }

  static convertSuite(suites) {
    if (Array.isArray(suites)) {
      const innerResult = [];
      suites.forEach(suite => {
        innerResult.push(ReportConverter.convertSuite(suite));
      });
      core.debug(`innerResult length ${innerResult.length}`);
      return innerResult;
    }

    core.debug(`Analyze suite ${suites._attributes.type} / ${suites._attributes.fullname}`);
    const result = [];
    const innerSuite = suites['test-suite'];
    if (innerSuite) {
      core.debug(`pushing suite ${innerSuite._attributes.id}`);
      result.push(...ReportConverter.convertSuite(innerSuite));
      core.debug(`suite ${innerSuite._attributes.id} pushed result to length ${result.length}`);
    }

    const tests = suites['test-case'];
    if (tests) {
      core.debug(`tests length ${tests.length}`);
      result.push(...ReportConverter.convertTests(suites._attributes.fullname, tests));
      core.debug(`tests pushed result to length ${result.length}`);
    }

    core.debug(`result length ${result.length}`);
    return result;
  }

  static convertTests(suite, tests) {
    if (Array.isArray(tests)) {
      const result = [];
      tests.forEach(test => {
        core.debug(`pushing test ${test._attributes.name}`);
        result.push(ReportConverter.convertTestCase(suite, test));
        core.debug(`test ${test._attributes.name} pushed result to length ${result.length}`);
      });
      return result;
    }

    return [ReportConverter.convertTestCase(suite, tests)];
  }

  static convertTestCase(suite, testCase) {
    const { name, fullname, result, failure, duration } = testCase._attributes;
    const meta = new TestMeta(suite, name);
    meta.result = result;
    meta.duration = Number(duration);

    if (!failure) {
      core.debug(`Skip test ${fullname} without failure data`);
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
      message: failure.message._cdata,
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
