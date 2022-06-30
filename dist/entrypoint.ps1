#
# Create directory for license activation
#

$ACTIVATE_LICENSE_PATH = "${env:GITHUB_WORKSPACE}/_activate-license"
New-Item -Path "$ACTIVATE_LICENSE_PATH" -ItemType Directory

#
# Run steps
#

& $PSScriptRoot\steps\activate.ps1
& $PSScriptRoot\steps\set_gitcredential.ps1
& $PSScriptRoot\steps\run_tests.ps1
& $PSScriptRoot\steps\return_license.ps1

#
# Remove license activation directory
#

Remove-Item "$ACTIVATE_LICENSE_PATH" -Recurse -Force

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
