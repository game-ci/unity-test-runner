#!/usr/bin/env bash

#
# Set and display project path
#

UNITY_PROJECT_PATH="$GITHUB_WORKSPACE/$PROJECT_PATH"
echo "Using project path \"$UNITY_PROJECT_PATH\"."

#
# Create an empty project for testing if in package mode
#

if [ "$PACKAGE_MODE" = "true" ]; then
  echo "Running tests on a Unity package rather than a Unity project."

  ACTIVATE_LICENSE_FILE_NAME="_activate-license"

  if [ -f "$ACTIVATE_LICENSE_FILE_NAME"]; then
    echo "Package is in repository root. Copying package to temporary directory to avoid Unity Errors."

    ROOT_FOLDER_NAME=$(echo "${PWD##*/}")
    COPIED_PACKAGE_DIR_NAME="copiedPackage"

    rsync -r "$GITHUB_WORKSPACE" "$COPIED_PACKAGE_DIR_NAME" --exclude "ACTIVATE_LICENSE_FILE_NAME" 

    UNITY_PROJECT_PATH="$COPIED_PACKAGE_DIR_NAME/$ROOT_FOLDER_NAME"
  fi

  echo ""
  echo "###########################"
  echo "#    Package Folder       #"
  echo "###########################"
  echo ""

  ls "$UNITY_PROJECT_PATH"
  echo ""

  echo "Creating an empty Unity project to add the package $PACKAGE_NAME to."

  TEMP_PROJECT_PATH="./TempProject"

  unity-editor \
    -batchmode \
    -createProject "$TEMP_PROJECT_PATH" \
    -quit

  # use jq to add the package to the temp project through manually modifying Packages/manifest.json
  echo "Adding package to the temporary project's dependencies and testables..."
  echo ""

  PACKAGE_MANIFEST_PATH="$TEMP_PROJECT_PATH/Packages/manifest.json"
  if [ ! -f "$PACKAGE_MANIFEST_PATH" ]; then
      echo "Packages/mainfest.json was not created properly. This indicates a problem with the Action, not with your package. Logging directories and aborting..."

      echo ""
      echo "###########################"
      echo "#   Temp Project Folder   #"
      echo "###########################"
      echo ""

      ls -a "$TEMP_PROJECT_PATH"

      echo ""
      echo "################################"
      echo "# Temp Project Packages Folder #"
      echo "################################"
      echo ""

      ls -a "$TEMP_PROJECT_PATH/Packages"

      exit 1
  fi

  PACKAGE_MANIFEST_JSON=$(cat "$PACKAGE_MANIFEST_PATH")
  echo "$PACKAGE_MANIFEST_JSON" | \
    jq \
    --arg packageName "$PACKAGE_NAME" \
    --arg projectPath "$UNITY_PROJECT_PATH" \
    '.dependencies += {"com.unity.testtools.codecoverage": "1.1.1"} | .dependencies += {"\($packageName)": "file:\($projectPath)"} | . += {testables: ["\($packageName)"]}' \
    > "$PACKAGE_MANIFEST_PATH"

  UNITY_PROJECT_PATH="$TEMP_PROJECT_PATH"
fi

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
