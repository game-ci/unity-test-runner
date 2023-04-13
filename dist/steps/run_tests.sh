#!/usr/bin/env bash

#
# Set and display project path
#

UNITY_PROJECT_PATH="$GITHUB_WORKSPACE/$PROJECT_PATH"
echo "Using project path \"$UNITY_PROJECT_PATH\"."

#
# Set and display the artifacts path
#

echo "Using artifacts path \"$ARTIFACTS_PATH\" to save test results."
FULL_ARTIFACTS_PATH=$GITHUB_WORKSPACE/$ARTIFACTS_PATH

#
# Set and display the coverage results path
#

echo "Using coverage results path \"$COVERAGE_RESULTS_PATH\" to save test coverage results."
FULL_COVERAGE_RESULTS_PATH=$GITHUB_WORKSPACE/$COVERAGE_RESULTS_PATH

#
# Display custom parameters
#

echo "Using custom parameters $CUSTOM_PARAMETERS."

# The following tests are 2019 mode (requires Unity 2019.2.11f1 or later)
# Reference: https://docs.unity3d.com/2019.3/Documentation/Manual/CommandLineArguments.html

#
# Display the unity version
#

echo "Using Unity version \"$UNITY_VERSION\" to test."

#
# Overall info
#

echo ""
echo "###########################"
echo "#    Artifacts folder     #"
echo "###########################"
echo ""
echo "Creating \"$FULL_ARTIFACTS_PATH\" if it does not exist."
mkdir -p $FULL_ARTIFACTS_PATH

echo ""
echo "###########################"
echo "#    Project directory    #"
echo "###########################"
echo ""
ls -alh $UNITY_PROJECT_PATH

#
# Testing for each platform
#
for platform in ${TEST_PLATFORMS//;/ }; do
  if [[ "$platform" == "standalone" ]]; then
    echo ""
    echo "###########################"
    echo "#   Building Standalone   #"
    echo "###########################"
    echo ""

    # Create directories if they do not exist
    mkdir -p "$UNITY_PROJECT_PATH/Assets/Editor/"
    mkdir -p "$UNITY_PROJECT_PATH/Assets/Player/"
    # Copy the scripts
    cp -R "$ACTION_FOLDER/UnityStandaloneScripts/Assets/Editor/" "$UNITY_PROJECT_PATH/Assets/Editor/"
    cp -R "$ACTION_FOLDER/UnityStandaloneScripts/Assets/Player/" "$UNITY_PROJECT_PATH/Assets/Player/"
    # Verify recursive paths
    ls -Ralph "$UNITY_PROJECT_PATH/Assets/Editor/"
    ls -Ralph "$UNITY_PROJECT_PATH/Assets/Player/"

    runTests="-runTests -testPlatform StandaloneLinux64 -builtTestRunnerPath $UNITY_PROJECT_PATH/Build/UnityTestRunner-Standalone"
  else
    echo ""
    echo "###########################"
    echo "#   Testing in $platform  #"
    echo "###########################"
    echo ""

    if [[ "$platform" != "COMBINE_RESULTS" ]]; then
      runTests="-runTests -testPlatform $platform -testResults $FULL_ARTIFACTS_PATH/$platform-results.xml"
    else
      runTests="-quit"
    fi
  fi

  unity-editor \
    -batchmode \
    -logFile "$FULL_ARTIFACTS_PATH/$platform.log" \
    -projectPath "$UNITY_PROJECT_PATH" \
    -coverageResultsPath "$FULL_COVERAGE_RESULTS_PATH" \
    $runTests \
    -enableCodeCoverage \
    -debugCodeOptimization \
    -coverageOptions "$COVERAGE_OPTIONS" \
    $CUSTOM_PARAMETERS

  # Catch exit code
  TEST_EXIT_CODE=$?

  # Print unity log output
  cat "$FULL_ARTIFACTS_PATH/$platform.log"

  if [[ $TEST_EXIT_CODE -eq 0 && "$platform" == "standalone" ]]; then
    echo ""
    echo "###########################"
    echo "#    Testing Standalone   #"
    echo "###########################"
    echo ""

    # Not sure how to get code coverage with this method.
    xvfb-run -a -e /dev/stdout "$UNITY_PROJECT_PATH/Build/UnityTestRunner-Standalone" \
      -batchmode \
      -nographics \
      -logFile "$FULL_ARTIFACTS_PATH/$platform-player.log" \
      -testResults "$FULL_ARTIFACTS_PATH/$platform-results.xml"

    # Catch exit code
    TEST_EXIT_CODE=$?

    # Player log gets spammed with connection failed messages from the PlayerConnection,
    # so we don't print it here. If there was an issue with the player tests, users can inspect
    # the log from the arifacts.
  fi

  # Display results
  if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "Run succeeded, no failures occurred";
  elif [ $TEST_EXIT_CODE -eq 2 ]; then
    echo "Run succeeded, some tests failed";
  elif [ $TEST_EXIT_CODE -eq 3 ]; then
    echo "Run failure (other failure)";
  else
    echo "Unexpected exit code $TEST_EXIT_CODE";
  fi

  if [ $TEST_EXIT_CODE -ne 0 ]; then
    TEST_RUNNER_EXIT_CODE=$TEST_EXIT_CODE
  fi

  echo ""
  echo "###########################"
  echo "#    $platform Results    #"
  echo "###########################"
  echo ""

  if [[ "$platform" != "COMBINE_RESULTS" ]]; then
    cat "$FULL_ARTIFACTS_PATH/$platform-results.xml"
    cat "$FULL_ARTIFACTS_PATH/$platform-results.xml" | grep test-run | grep Passed
  fi
done

#
# Permissions
#

# Make a given user owner of all artifacts
if [[ -n "$CHOWN_FILES_TO" ]]; then
  chown -R "$CHOWN_FILES_TO" "$UNITY_PROJECT_PATH"
  chown -R "$CHOWN_FILES_TO" "$FULL_ARTIFACTS_PATH"
  chown -R "$CHOWN_FILES_TO" "$FULL_COVERAGE_RESULTS_PATH"
fi

# Add read permissions for everyone to all artifacts
chmod -R a+r "$UNITY_PROJECT_PATH"
chmod -R a+r "$FULL_ARTIFACTS_PATH"
chmod -R a+r "$FULL_COVERAGE_RESULTS_PATH"
