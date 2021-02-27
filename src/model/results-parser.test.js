import ResultsParser from './results-parser';

describe('ResultsParser', () => {
  describe('parseResults', () => {
    it('throws for missing file', () => {
      expect(() => ResultsParser.parseResults('')).rejects.toEqual(Error);
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
        [
          {
            annotation: undefined,
            duration: Number.NaN,
            result: undefined,
            suite: 'Inner Suite Full Name',
            title: 'testC',
          },
        ],
        {
          annotation: undefined,
          duration: Number.NaN,
          result: undefined,
          suite: 'Suite Full Name',
          title: 'testA',
        },
        {
          annotation: undefined,
          duration: Number.NaN,
          result: undefined,
          suite: 'Suite Full Name',
          title: 'testB',
        },
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

    test('prepare annotation', () => {
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
  });

  describe('findAnnotationPoint', () => {
    test('keep working if not matching', () => {
      const result = ResultsParser.findAnnotationPoint('');
      expect(result.path).toBe('');
      expect(result.line).toBe(0);
    });

    test('simple annotation point', () => {
      const result = ResultsParser.findAnnotationPoint(`at Tests.PlayModeTest+<FailedUnityTest>d__5.MoveNext () [0x0002e] in /github/workspace/unity-project/Assets/Tests/PlayModeTest.cs:39
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
  });
});
