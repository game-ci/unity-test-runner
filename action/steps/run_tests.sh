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
# Display custom parameters
#
echo "Using custom parameters $CUSTOM_PARAMETERS."

# Set the modes for testing
case $TEST_MODE in
  editmode)
    echo "Edit mode selected for testing."
    EDIT_MODE=true
    ;;
  playmode)
    echo "Play mode selected for testing."
    PLAY_MODE=true
    ;;
  *)
    echo "All modes selected for testing."
    EDIT_MODE=true
    PLAY_MODE=true
    ;;
esac

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
# Testing in EditMode
#

if [ $EDIT_MODE = true ]; then
  echo ""
  echo "###########################"
  echo "#   Testing in EditMode   #"
  echo "###########################"
  echo ""
  unity-editor \
    -batchmode \
    -logFile "$FULL_ARTIFACTS_PATH/editmode.log" \
    -projectPath "$UNITY_PROJECT_PATH" \
    -runTests \
    -testPlatform editmode \
    -testResults "$FULL_ARTIFACTS_PATH/editmode-results.xml" \
    $CUSTOM_PARAMETERS

  # Catch exit code
  EDIT_MODE_EXIT_CODE=$?

  # Print unity log output
  cat "$FULL_ARTIFACTS_PATH/editmode.log"

  # Display results
  if [ $EDIT_MODE_EXIT_CODE -eq 0 ]; then
    echo "Run succeeded, no failures occurred";
  elif [ $EDIT_MODE_EXIT_CODE -eq 2 ]; then
    echo "Run succeeded, some tests failed";
  elif [ $EDIT_MODE_EXIT_CODE -eq 3 ]; then
    echo "Run failure (other failure)";
  else
    echo "Unexpected exit code $EDIT_MODE_EXIT_CODE";
  fi
fi

#
# Testing in PlayMode
#

if [ $PLAY_MODE = true ]; then
  echo ""
  echo "###########################"
  echo "#   Testing in PlayMode   #"
  echo "###########################"
  echo ""
  unity-editor \
    -batchmode \
    -logFile "$FULL_ARTIFACTS_PATH/playmode.log" \
    -projectPath "$UNITY_PROJECT_PATH" \
    -runTests \
    -testPlatform playmode \
    -testResults "$FULL_ARTIFACTS_PATH/playmode-results.xml" \
    $CUSTOM_PARAMETERS

  # Catch exit code
  PLAY_MODE_EXIT_CODE=$?

  # Print unity log output
  cat "$FULL_ARTIFACTS_PATH/playmode.log"

  # Display results
  if [ $PLAY_MODE_EXIT_CODE -eq 0 ]; then
    echo "Run succeeded, no failures occurred";
  elif [ $PLAY_MODE_EXIT_CODE -eq 2 ]; then
    echo "Run succeeded, some tests failed";
  elif [ $PLAY_MODE_EXIT_CODE -eq 3 ]; then
    echo "Run failure (other failure)";
  else
    echo "Unexpected exit code $PLAY_MODE_EXIT_CODE";
  fi
fi

#
# Results
#

echo ""
echo "###########################"
echo "#    Project directory    #"
echo "###########################"
echo ""
ls -alh $UNITY_PROJECT_PATH

if [ $EDIT_MODE = true ]; then
  echo ""
  echo "###########################"
  echo "#    Edit Mode Results    #"
  echo "###########################"
  echo ""
  cat "$FULL_ARTIFACTS_PATH/editmode-results.xml"
  cat "$FULL_ARTIFACTS_PATH/editmode-results.xml" | grep test-run | grep Passed
fi

if [ $PLAY_MODE = true ]; then
  echo ""
  echo "###########################"
  echo "#    Play Mode Results    #"
  echo "###########################"
  echo ""
  cat "$FULL_ARTIFACTS_PATH/playmode-results.xml"
  cat "$FULL_ARTIFACTS_PATH/playmode-results.xml" | grep test-run | grep Passed
fi

#
# Exit
#

if [ $EDIT_MODE_EXIT_CODE -gt 0 ]; then
  TEST_RUNNER_EXIT_CODE=$EDIT_MODE_EXIT_CODE
fi

if [ $PLAY_MODE_EXIT_CODE -gt 0 ]; then
  TEST_RUNNER_EXIT_CODE=$PLAY_MODE_EXIT_CODE
fi
