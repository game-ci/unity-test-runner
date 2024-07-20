import * as fs from 'fs';
import * as xmljs from 'xml-js';
import ResultsParser from './results-parser';
import { TestMeta } from './results-meta';

describe('ResultsParser', () => {
  describe('parseResults', () => {
    it('throws for missing file', () => {
      expect(() => ResultsParser.parseResults('')).rejects;
    });

    it('parses editmode-results.xml', () => {
      expect(() => ResultsParser.parseResults('./artifacts/editmode-results.xml')).not.toThrow();
    });

    it('parses playmode-results.xml', () => {
      expect(() => ResultsParser.parseResults('./artifacts/playmode-results.xml')).not.toThrow();
    });
  });

  describe('convertResults', () => {
    it('converts editmode-results.xml', () => {
      const file = fs.readFileSync('./artifacts/editmode-results.xml', 'utf8');
      const filedata = xmljs.xml2js(file, { compact: true });
      const result = ResultsParser.convertResults('editmode-results.xml', filedata);
      expect(result.suites.length).toEqual(1);
    });

    it('converts playmode-results.xml', () => {
      const file = fs.readFileSync('./artifacts/playmode-results.xml', 'utf8');
      const filedata = xmljs.xml2js(file, { compact: true });
      const result = ResultsParser.convertResults('playmode-results.xml', filedata);
      expect(result.suites.length).toEqual(3);
    });
  });

  describe('convertSuite', () => {
    test('convert single', () => {
      const targetSuite = {
        _attributes: {
          fullname: 'Suite Full Name',
        },
        'test-case': [{ _attributes: { name: 'testA' } }, { _attributes: { name: 'testB' } }],
        'test-suite': [
          {
            _attributes: {
              fullname: 'Inner Suite Full Name',
            },
            'test-case': { _attributes: { name: 'testC' } },
            'test-suite': [],
          },
        ],
      };
      const result = ResultsParser.convertSuite(targetSuite);

      expect(result).toMatchObject([
        new TestMeta('Inner Suite Full Name', 'testC'),
        new TestMeta('Suite Full Name', 'testA'),
        new TestMeta('Suite Full Name', 'testB'),
      ]);
    });
  });

  describe('convertTests', () => {
    test('convert array', () => {
      const testA = { _attributes: { name: 'testA' } };
      const testB = { _attributes: { name: 'testB' } };
      const testResult = [testA, testB];
      const result = ResultsParser.convertTests('Test Suite', testResult);

      expect(result).toMatchObject([
        { suite: 'Test Suite', title: 'testA' },
        { suite: 'Test Suite', title: 'testB' },
      ]);
    });

    test('convert single', () => {
      const testA = { _attributes: { name: 'testA' } };
      const result = ResultsParser.convertTests('Test Suite', testA);

      expect(result).toMatchObject([{ suite: 'Test Suite', title: 'testA' }]);
    });
  });

  describe('convertTestCase', () => {
    test('not failed', () => {
      const result = ResultsParser.convertTestCase('Test Suite', {
        _attributes: {
          name: 'Test Name',
          duration: '3.14',
        },
      });

      expect(result.suite).toBe('Test Suite');
      expect(result.title).toBe('Test Name');
      expect(result.duration).toBe(3.14);
      expect(result.annotation).toBeUndefined();
    });

    test('no stack trace', () => {
      const result = ResultsParser.convertTestCase('Test Suite', {
        _attributes: {
          name: 'Test Name',
          duration: '3.14',
        },
        failure: {
          message: { _cdata: 'Message CDATA' },
        },
      });

      expect(result.suite).toBe('Test Suite');
      expect(result.title).toBe('Test Name');
      expect(result.duration).toBe(3.14);
      expect(result.annotation).toBeUndefined();
    });

    test('no cdata in stack trace', () => {
      const result = ResultsParser.convertTestCase('Test Suite', {
        _attributes: {
          name: 'Test Name',
          duration: '3.14',
        },
        failure: {
          message: { _cdata: 'Message CDATA' },
          'stack-trace': {},
        },
      });

      expect(result.suite).toBe('Test Suite');
      expect(result.title).toBe('Test Name');
      expect(result.duration).toBe(3.14);
      expect(result.annotation).toBeUndefined();
    });

    test('no annotation path', () => {
      const result = ResultsParser.convertTestCase('Test Suite', {
        _attributes: {
          name: 'Test Name',
          duration: '3.14',
        },
        failure: {
          message: { _cdata: 'Message CDATA' },
          'stack-trace': { _cdata: 'Test CDATA' },
        },
      });

      expect(result.suite).toBe('Test Suite');
      expect(result.title).toBe('Test Name');
      expect(result.duration).toBe(3.14);
      expect(result.annotation).toBeUndefined();
    });

    test('prepare annotation without console output', () => {
      const result = ResultsParser.convertTestCase('Test Suite', {
        _attributes: {
          name: 'Test Name',
          fullname: 'Test Full Name',
          duration: '3.14',
        },
        failure: {
          message: { _cdata: 'Message CDATA' },
          'stack-trace': {
            _cdata:
              'at Tests.SetupFailedTest.SetUp () [0x00000] in /github/workspace/unity-project/Assets/Tests/SetupFailedTest.cs:10',
          },
        },
      });

      expect(result.suite).toBe('Test Suite');
      expect(result.title).toBe('Test Name');
      expect(result.duration).toBe(3.14);
      expect(result.annotation).toMatchObject({
        annotation_level: 'failure',
        end_line: 10,
        message: 'Message CDATA',
        path: '/github/workspace/unity-project/Assets/Tests/SetupFailedTest.cs',
        raw_details:
          'at Tests.SetupFailedTest.SetUp () [0x00000] in /github/workspace/unity-project/Assets/Tests/SetupFailedTest.cs:10',
        start_line: 10,
        title: 'Test Full Name',
      });
    });

    test('prepare annotation with console output', () => {
      const result = ResultsParser.convertTestCase('Test Suite', {
        _attributes: {
          name: 'Test Name',
          fullname: 'Test Full Name',
          duration: '3.14',
        },
        output: {
          _cdata: '[Warning] This is a warning',
        },
        failure: {
          message: { _cdata: 'Message CDATA' },
          'stack-trace': {
            _cdata:
              'at Tests.SetupFailedTest.SetUp () [0x00000] in /github/workspace/unity-project/Assets/Tests/SetupFailedTest.cs:10',
          },
        },
      });

      expect(result.suite).toBe('Test Suite');
      expect(result.title).toBe('Test Name');
      expect(result.duration).toBe(3.14);
      expect(result.annotation).toMatchObject({
        annotation_level: 'failure',
        end_line: 10,
        message: 'Message CDATA',
        path: '/github/workspace/unity-project/Assets/Tests/SetupFailedTest.cs',
        raw_details:
          '[Warning] This is a warning\nat Tests.SetupFailedTest.SetUp () [0x00000] in /github/workspace/unity-project/Assets/Tests/SetupFailedTest.cs:10',
        start_line: 10,
        title: 'Test Full Name',
      });
    });
  });

  describe('findAnnotationPoint', () => {
    test('keep working if not matching', () => {
      const result = ResultsParser.findAnnotationPoint('');
      expect(result.path).toBe('');
      expect(result.line).toBe(0);
    });

    test('simple annotation point', () => {
      const result =
        ResultsParser.findAnnotationPoint(`at Tests.PlayModeTest+<FailedUnityTest>d__5.MoveNext () [0x0002e] in /github/workspace/unity-project/Assets/Tests/PlayModeTest.cs:39
at UnityEngine.TestTools.TestEnumerator+<Execute>d__6.MoveNext () [0x00038] in /github/workspace/unity-project/Library/PackageCache/com.unity.test-framework@1.1.19/UnityEngine.TestRunner/NUnitExtensions/Attributes/TestEnumerator.cs:36`);
      expect(result.path).toBe('/github/workspace/unity-project/Assets/Tests/PlayModeTest.cs');
      expect(result.line).toBe(39);
    });

    test('first entry with non-zero line number annotation point', () => {
      const result =
        ResultsParser.findAnnotationPoint(`at FluentAssertions.Execution.LateBoundTestFramework.Throw (System.String message) [0x00044] in <527a5493e59e45679b35c1e8d65350b3>:0
at FluentAssertions.Execution.TestFrameworkProvider.Throw (System.String message) [0x00011] in <527a5493e59e45679b35c1e8d65350b3>:0
at FluentAssertions.Execution.DefaultAssertionStrategy.HandleFailure (System.String message) [0x00005] in <527a5493e59e45679b35c1e8d65350b3>:0
at Tests.PlayModeTest+<FailedUnityTest>d__5.MoveNext () [0x0002e] in /github/workspace/unity-project/Assets/Tests/PlayModeTest.cs:39
at UnityEngine.TestTools.TestEnumerator+<Execute>d__6.MoveNext () [0x00038] in /github/workspace/unity-project/Library/PackageCache/com.unity.test-framework@1.1.19/UnityEngine.TestRunner/NUnitExtensions/Attributes/TestEnumerator.cs:36`);
      expect(result.path).toBe('/github/workspace/unity-project/Assets/Tests/PlayModeTest.cs');
      expect(result.line).toBe(39);
    });

    test('setup annotation point', () => {
      const result = ResultsParser.findAnnotationPoint(`SetUp
at Tests.SetupFailedTest.SetUp () [0x00000] in /github/workspace/unity-project/Assets/Tests/SetupFailedTest.cs:10`);
      expect(result.path).toBe('/github/workspace/unity-project/Assets/Tests/SetupFailedTest.cs');
      expect(result.line).toBe(10);
    });

    test('Debug.LogError annotation point', () => {
      const result = ResultsParser.findAnnotationPoint(
        `FMODUnity.RuntimeUtils:DebugLogError (string) (at Assets/Plugins/FMOD/src/RuntimeUtils.cs:580)`,
      );
      expect(result.path).toBe('Assets/Plugins/FMOD/src/RuntimeUtils.cs');
      expect(result.line).toBe(580);
    });
  });
});
