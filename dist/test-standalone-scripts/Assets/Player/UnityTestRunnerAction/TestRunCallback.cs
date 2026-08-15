using NUnit.Framework.Interfaces;
using System;
using System.Xml;
using UnityEngine;
using UnityEngine.TestRunner;
using UnityTestRunnerAction;

[assembly: TestRunCallback(typeof(MyTestRunCallback))]

namespace UnityTestRunnerAction
{
    public class MyTestRunCallback : ITestRunCallback
    {
        private const string k_nUnitVersion = "3.5.0.0";

        private const string k_TestRunNode = "test-run";
        private const string k_Id = "id";
        private const string k_Testcasecount = "testcasecount";
        private const string k_Result = "result";
        private const string k_Total = "total";
        private const string k_Passed = "passed";
        private const string k_Failed = "failed";
        private const string k_Inconclusive = "inconclusive";
        private const string k_Skipped = "skipped";
        private const string k_Asserts = "asserts";
        private const string k_EngineVersion = "engine-version";
        private const string k_ClrVersion = "clr-version";
        private const string k_StartTime = "start-time";
        private const string k_EndTime = "end-time";
        private const string k_Duration = "duration";

        private const string k_TimeFormat = "u";

        private ITest fullTest;

        public void RunStarted(ITest testsToRun)
        {
            if (fullTest == null)
            {
                fullTest = testsToRun;
            }
        }

        public void RunFinished(ITestResult testResults)
        {
            if (testResults.Test != fullTest)
            {
                return;
            }

            string[] commandLineArgs = Environment.GetCommandLineArgs();
            string testResultsPath = commandLineArgs[Array.IndexOf(commandLineArgs, "-testResults") + 1];
            using (var writer = XmlWriter.Create(testResultsPath, new XmlWriterSettings() { Indent = true }))
            {
                // Manually add the outer test-run node, because testResults.ToXml doesn't include it.

                var testRunNode = new TNode(k_TestRunNode);

                testRunNode.AddAttribute(k_Id, "2");
                testRunNode.AddAttribute(k_Testcasecount, (testResults.PassCount + testResults.FailCount + testResults.SkipCount + testResults.InconclusiveCount).ToString());
                testRunNode.AddAttribute(k_Result, testResults.ResultState.ToString());
                testRunNode.AddAttribute(k_Total, (testResults.PassCount + testResults.FailCount + testResults.SkipCount + testResults.InconclusiveCount).ToString());
                testRunNode.AddAttribute(k_Passed, testResults.PassCount.ToString());
                testRunNode.AddAttribute(k_Failed, testResults.FailCount.ToString());
                testRunNode.AddAttribute(k_Inconclusive, testResults.InconclusiveCount.ToString());
                testRunNode.AddAttribute(k_Skipped, testResults.SkipCount.ToString());
                testRunNode.AddAttribute(k_Asserts, testResults.AssertCount.ToString());
                testRunNode.AddAttribute(k_EngineVersion, k_nUnitVersion);
                testRunNode.AddAttribute(k_ClrVersion, Environment.Version.ToString());
                testRunNode.AddAttribute(k_StartTime, testResults.StartTime.ToString(k_TimeFormat));
                testRunNode.AddAttribute(k_EndTime, testResults.EndTime.ToString(k_TimeFormat));
                testRunNode.AddAttribute(k_Duration, testResults.Duration.ToString());

                var resultNode = testResults.ToXml(true);
                testRunNode.ChildNodes.Add(resultNode);

                testRunNode.WriteTo(writer);
                writer.Flush();
            }

            Application.Quit(testResults.ResultState.Status == TestStatus.Failed ? 2 : 0);
        }

        public void TestStarted(ITest test)
        {
        }

        public void TestFinished(ITestResult result)
        {
        }
    }
}
