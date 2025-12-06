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

            // Enable parallel linking for IL2CPP builds
            SetParallelLinking();

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

        private static void SetParallelLinking()
        {
            string additionalArgs = PlayerSettings.additionalIl2CppArgs;

            // Determine number of parallel jobs (use CPU count, or default to 2)
            int numJobs = Environment.ProcessorCount;
            if (numJobs <= 0) numJobs = 2;

            // Use host platform (where Unity is running) instead of target platform to support cross-compilation
            // Platform-specific parallel linking flags based on the host platform
            RuntimePlatform hostPlatform = Application.platform;
            switch (hostPlatform)
            {
                case RuntimePlatform.WindowsEditor:
                case RuntimePlatform.WindowsPlayer:
                    string cgthreadsFlag = $"--linker-flags=/CGTHREADS:{numJobs}";
                    if (!additionalArgs.Contains("/CGTHREADS:"))
                    {
                        additionalArgs = string.IsNullOrEmpty(additionalArgs)
                            ? cgthreadsFlag
                            : $"{additionalArgs} {cgthreadsFlag}";
                    }
                    break;

                case RuntimePlatform.OSXEditor:
                case RuntimePlatform.OSXPlayer:
                case RuntimePlatform.LinuxEditor:
                case RuntimePlatform.LinuxPlayer:
                    if (!additionalArgs.Contains("--threads"))
                    {
                        additionalArgs = string.IsNullOrEmpty(additionalArgs)
                            ? $"-Wl,--threads={numJobs}"
                            : $"{additionalArgs} -Wl,--threads={numJobs}";
                    }
                    break;
            }

            PlayerSettings.additionalIl2CppArgs = additionalArgs;
            Debug.Log($"IL2CPP parallel linking enabled with {numJobs} jobs on host platform {hostPlatform}. Additional args: {additionalArgs}");
        }
    }
}
