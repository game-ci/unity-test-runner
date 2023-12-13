#
# Run steps
#

. "c:\steps\set_gitcredential.ps1"

. "c:\steps\activate.ps1"

# If we didn't activate successfully, exit with the exit code from the activation step.
if ($ACTIVATION_EXIT_CODE -ne 0) {
  exit $ACTIVATION_EXIT_CODE
}

. "c:\steps\run_tests.ps1"

. "c:\steps\return_license.ps1"

#
# Instructions for debugging
#

if ($TEST_RUNNER_EXIT_CODE -gt 0)
{
    Write-Output ""
    Write-Output "###########################"
    Write-Output "#         Failure         #"
    Write-Output "###########################"
    Write-Output ""
    Write-Output "Please note that the exit code is not very descriptive."
    Write-Output "Most likely it will not help you solve the issue."
    Write-Output ""
    Write-Output "To find the reason for failure: please search for errors in the log above."
    Write-Output ""
}

#
# Exit with code from the build step.
#

if ( ($USE_EXIT_CODE -eq "true") -and ($TEST_RUNNER_EXIT_CODE -ne 2) )
{
    exit $TEST_RUNNER_EXIT_CODE
}
