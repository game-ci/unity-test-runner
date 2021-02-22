interface CommonAttributes {
  id: string;
  result: string;
  asserts: string;

  'start-time': string;
  'end-time': string;
  duration: string;
}

interface CommonSuiteAttributes extends CommonAttributes {
  total: string;
  passed: string;
  failed: string;
  skipped: string;
}

export interface TestRun {
  _attributes: TestRunAttributes;
  'test-suite': TestSuite | TestSuite[];
}

export interface TestRunAttributes extends CommonSuiteAttributes {
  testcasecount: string;
  'engine-version': string;
}

export interface TestSuite {
  _attributes: TestSuiteAttributes;
  'test-suite': TestSuite | TestSuite[];
  'test-case': TestCase | TestCase[];
  failure?: FailureMessage;
}

export interface TestSuiteAttributes extends CommonSuiteAttributes {
  type: string;
  name: string;
  fullname: string;
}

export interface TestCase {
  _attributes: TestCaseAttributes;
  failure?: FailureMessage;
}

export interface TestCaseAttributes extends CommonAttributes {
  name: string;
  fullname: string;
  methodname: string;
  classname: string;
  runstate: string;
  seed: string;
}

export interface FailureMessage {
  message: { cdata: string };
  'stack-trace'?: { cdata: string };
}
