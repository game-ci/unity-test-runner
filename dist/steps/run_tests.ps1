#
# Set and display project path
#

$UNITY_PROJECT_PATH = "${env:GITHUB_WORKSPACE}/${env:PROJECT_PATH}"
Write-Output "Using project path $UNITY_PROJECT_PATH"

#
# Set and display the artifacts path
#

Write-Output "Using artifacts path ${env:ARTIFACTS_PATH} to save test results."
$FULL_ARTIFACTS_PATH = "${env:GITHUB_WORKSPACE}\${env:ARTIFACTS_PATH}"

#
# Set and display the coverage results path
#

Write-Output "Using coverage results path ${env:COVERAGE_RESULTS_PATH} to save test coverage results."
$FULL_COVERAGE_RESULTS_PATH = "${env:GITHUB_WORKSPACE}\${env:COVERAGE_RESULTS_PATH}"

#
# Display custom parameters
#

Write-Output "Using custom parameters ${env:CUSTOM_PARAMETERS}"

# The following tests are 2019 mode (requires Unity 2019.2.11f1 or later)
# Reference: https://docs.unity3d.com/2019.3/Documentation/Manual/CommandLineArguments.html

#
# Display the unity version
#

Write-Output "Using Unity version ${env:UNITY_VERSION} to test."

#
# Overall info
#

Write-Output ""
Write-Output "###########################"
Write-Output "#    Artifacts folder     #"
Write-Output "###########################"
Write-Output ""
Write-Output "Creating $FULL_ARTIFACTS_PATH if it does not exist."
New-Item -Path "$FULL_ARTIFACTS_PATH" -ItemType Directory

Write-Output ""
Write-Output "###########################"
Write-Output "#    Project directory    #"
Write-Output "###########################"
Write-Output ""
Get-ChildItem -Hidden -Path $UNITY_PROJECT_PATH

#
# Testing for each platform
#
foreach ( $platform in ${env:TEST_PLATFORMS}.Split(";") )
{
    if ( "$platform" -eq "standalone" )
    {
        Write-Output ""
        Write-Output "###########################"
        Write-Output "#   Building Standalone   #"
        Write-Output "###########################"
        Write-Output ""
  
        # Create directories if they do not exist
        if(-Not (Test-Path -Path $Env:UNITY_PROJECT_PATH\Assets\Editor))
        {
            # We use -Force to suppress output, doesn't overwrite anything
            New-Item -ItemType Directory -Force -Path $Env:UNITY_PROJECT_PATH\Assets\Editor
        }
        if(-Not (Test-Path -Path $Env:UNITY_PROJECT_PATH\Assets\Player))
        {
            # We use -Force to suppress output, doesn't overwrite anything
            New-Item -ItemType Directory -Force -Path $Env:UNITY_PROJECT_PATH\Assets\Player
        }

        # Copy the scripts
        Copy-Item -Path "c:\UnityStandaloneScripts\Assets\Editor" -Destination $Env:UNITY_PROJECT_PATH\Assets\Editor -Recurse
        Copy-Item -Path "c:\UnityStandaloneScripts\Assets\Player" -Destination $Env:UNITY_PROJECT_PATH\Assets\Player -Recurse

        # Verify recursive paths
        Get-ChildItem -Path $Env:UNITY_PROJECT_PATH\Assets\Editor -Recurse
        Get-ChildItem -Path $Env:UNITY_PROJECT_PATH\Assets\Player -Recurse
    
        $runTests="-runTests -testPlatform StandaloneWindows64 -builtTestRunnerPath $UNITY_PROJECT_PATH\Build\UnityTestRunner-Standalone.exe"
    }
    else
    {
        Write-Output ""
        Write-Output "###########################"
        Write-Output "#   Testing in $platform  #"
        Write-Output "###########################"
        Write-Output ""

        if ( $platform -ne "COMBINE_RESULTS" )
        {
            $runTests = "-runTests -testPlatform $platform -testResults $FULL_ARTIFACTS_PATH/$platform-results.xml"
        }
        else
        {
            $runTests = "-quit"
        }
    }

    $TEST_OUTPUT = Start-Process -NoNewWindow -Wait -PassThru "C:\Program Files\Unity\Hub\Editor\${env:UNITY_VERSION}\editor\Unity.exe" -ArgumentList "-batchmode -logFile $FULL_ARTIFACTS_PATH\$platform.log -projectPath $UNITY_PROJECT_PATH -coverageResultsPath $FULL_COVERAGE_RESULTS_PATH $runTests -enableCodeCoverage -debugCodeOptimization -coverageOptions ${env:COVERAGE_OPTIONS} ${env:CUSTOM_PARAMETERS}"

    # Catch exit code
    $TEST_EXIT_CODE = $TEST_OUTPUT.ExitCode

    # Print unity log output
    Get-Content "$FULL_ARTIFACTS_PATH/$platform.log"

    if ( ( $TEST_EXIT_CODE -eq 0 ) -and ( "$platform" -eq "standalone" ) )
    {
        # Code Coverage currently only supports code ran in the Editor and not in Standalone/Player.
        # https://docs.unity.cn/Packages/com.unity.testtools.codecoverage@1.1/manual/TechnicalDetails.html#how-it-works
        
        $TEST_OUTPUT = Start-Process -NoNewWindow -Wait -PassThru "$UNITY_PROJECT_PATH\Build\UnityTestRunner-Standalone.exe" -ArgumentList "-batchmode -nographics -logFile $FULL_ARTIFACTS_PATH\$platform-player.log -testResults $FULL_ARTIFACTS_PATH\$platform-results.xml"

        # Catch exit code
        $TEST_EXIT_CODE = $TEST_OUTPUT.ExitCode

        # Print player log output
        Get-Content "$FULL_ARTIFACTS_PATH/$platform-player.log"
    }

    # Display results
    if ($TEST_EXIT_CODE -eq 0)
    {
        Write-Output "Run succeeded, no failures occurred";
    }
    elseif ($TEST_EXIT_CODE -eq 2)
    {
        Write-Output "Run succeeded, some tests failed";
    }
    elseif ($TEST_EXIT_CODE -eq 3)
    {
        Write-Output "Run failure (other failure)";
    }
    else
    {
        Write-Output "Unexpected exit code $TEST_EXIT_CODE";
    }

    if ( $TEST_EXIT_CODE -ne 0)
    {
        $TEST_RUNNER_EXIT_CODE = $TEST_EXIT_CODE
    }

    Write-Output ""
    Write-Output "###########################"
    Write-Output "#    $platform Results    #"
    Write-Output "###########################"
    Write-Output ""

    if ($platform -ne "COMBINE_RESULTS")
    {
        Get-Content "$FULL_ARTIFACTS_PATH/$platform-results.xml"
        Get-Content "$FULL_ARTIFACTS_PATH/$platform-results.xml" | Select-String "test-run" | Select-String "Passed"
    }
}