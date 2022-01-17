#!/usr/bin/env bash

#
# Create directory for license activation
#

ACTIVATE_LICENSE_PATH="$GITHUB_WORKSPACE/_activate-license"
mkdir -p "$ACTIVATE_LICENSE_PATH"

#
# Check if apt-get is available if in package mode (if not, we must abort since we need to install jq)
#
if [ "$PACKAGE_MODE" = "true" ]; then
  echo "Checking if apt-get is installed to install jq."
  apt-get --version > /dev/null 2>&1
  if [ $? -ne 0 ]; then
    echo "apt-get is not installed. Aborting..."
    exit
  fi

  # install jq
  apt-get update \
    &&  apt-get upgrade -y --force-yes \
    &&  apt-get install -y --force-yes \
        jq \
    &&  apt-get clean \
    &&  rm -rf /var/cache/apt/archives/* /var/lib/apt/lists/*
fi

#
# Run steps
#

source /steps/activate.sh
source /steps/set_gitcredential.sh
source /steps/run_tests.sh
source /steps/return_license.sh

#
# Remove license activation directory
#

rm -r "$ACTIVATE_LICENSE_PATH"

#
# Instructions for debugging
#

if [[ $TEST_RUNNER_EXIT_CODE -gt 0 ]]; then
echo ""
echo "###########################"
echo "#         Failure         #"
echo "###########################"
echo ""
echo "Please note that the exit code is not very descriptive."
echo "Most likely it will not help you solve the issue."
echo ""
echo "To find the reason for failure: please search for errors in the log above."
echo ""
fi;

#
# Exit with code from the build step.
#

if [[ $USE_EXIT_CODE == true || $TEST_RUNNER_EXIT_CODE -ne 2 ]]; then
exit $TEST_RUNNER_EXIT_CODE
fi;
