#!/usr/bin/env bash

#
# Run steps
#

source /github/action/steps/activate.sh
source /github/action/steps/run_tests.sh
source /github/action/steps/return_license.sh

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

exit $TEST_RUNNER_EXIT_CODE
