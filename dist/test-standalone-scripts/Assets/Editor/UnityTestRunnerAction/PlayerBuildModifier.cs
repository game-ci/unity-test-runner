using System;
using System.Linq;
using UnityEditor;
using UnityEditor.TestTools;
using UnityEngine;
using UnityEngine.TestTools;
using UnityTestRunnerAction;

[assembly: TestPlayerBuildModifier(typeof(HeadlessPlayModeSetup))]
[assembly: PostBuildCleanup(typeof(HeadlessPlayModeSetup))]

namespace UnityTestRunnerAction
{
    public class HeadlessPlayModeSetup : ITestPlayerBuildModifier, IPostBuildCleanup
    {
        private static bool s_RunningPlayerTests;
        public BuildPlayerOptions ModifyOptions(BuildPlayerOptions playerOptions)
        {
            // Do not launch the player after the build completes. Disable the PlayerConnection.
            playerOptions.options &= ~(BuildOptions.AutoRunPlayer | BuildOptions.ConnectToHost | BuildOptions.WaitForPlayerConnection);

            // Not supporting Mac currently.
            playerOptions.target = SystemInfo.operatingSystemFamily == OperatingSystemFamily.Windows ? BuildTarget.StandaloneWindows64 : BuildTarget.StandaloneLinux64;

            string[] commandLineArgs = Environment.GetCommandLineArgs();
            playerOptions.locationPathName = commandLineArgs[Array.IndexOf(commandLineArgs, "-builtTestRunnerPath") + 1]; ;

            // Instruct the cleanup to exit the Editor if the run came from the command line. 
            // The variable is static because the cleanup is being invoked in a new instance of the class.
            s_RunningPlayerTests = true;
            return playerOptions;
        }

        public void Cleanup()
        {
            if (s_RunningPlayerTests && IsRunningTestsFromCommandLine())
            {
                // Exit the Editor on the next update, allowing for other PostBuildCleanup steps to run.
                EditorApplication.update += () => { EditorApplication.Exit(0); };
            }
        }

        private static bool IsRunningTestsFromCommandLine()
        {
            var commandLineArgs = Environment.GetCommandLineArgs();
            return commandLineArgs.Any(value => value == "-runTests");
        }
    }
}
