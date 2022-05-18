# Run in ACTIVATE_LICENSE_PATH directory
Write-Output "Changing to $ACTIVATE_LICENSE_PATH directory."
Push-Location "$ACTIVATE_LICENSE_PATH"

if ( ($null -ne ${env:UNITY_LICENSE}) -or ($null -ne ${env:UNITY_LICENSE_FILE}) )
{
    #
    # PERSONAL LICENSE MODE
    #
    # This will activate Unity, using a license file
    #
    # Note that this is the ONLY WAY for PERSONAL LICENSES in 2020.
    #   * See for more details: https://gitlab.com/gableroux/unity3d-gitlab-ci-example/issues/5#note_72815478
    #
    # The license file can be acquired using `game-ci/request-manual-activation-file` action.
    Write-Output "Requesting activation (personal license)"

    # Set the license file path
    $FILE_PATH = "$ACTIVATE_LICENSE_PATH\UnityLicenseFile.ulf"

    if ($null -ne ${env:UNITY_LICENSE})
    {
        # Copy license file from Github variables
        Add-Content -Path $FILE_PATH -Value ${env:UNITY_LICENSE}
    }
    elseif ($null -ne ${env:UNITY_LICENSE_FILE})
    {
         # Copy license file from file system
        Add-Content -Path $FILE_PATH -Value ${env:UNITY_LICENSE_FILE}
    }
    $convert = (Get-Content -Raw $FILE_PATH) -replace "`r`n","`n"
    [io.file]::WriteAllText($FILE_PATH, $convert)

    # Activate license
    $ACTIVATION_OUTPUT = Start-Process -NoNewWindow -Wait -PassThru "C:\Program Files\Unity\Hub\Editor\${env:UNITY_VERSION}\editor\Unity.exe" -ArgumentList "-batchmode -nographics -logFile $ACTIVATE_LICENSE_PATH\activate.log -quit -manualLicenseFile $FILE_PATH"

    # Store the exit code from the verify command
    $UNITY_EXIT_CODE = $ACTIVATION_OUTPUT.ExitCode

    # The exit code for personal activation is always 1;
    # Determine whether activation was successful.
    #
    # Successful output should include the following:
    #
    #   "LICENSE SYSTEM [2020120 18:51:20] Next license update check is after 2019-11-25T18:23:38"
    #
    $ACTIVATION_SUCCESSFUL = (Get-Content $ACTIVATE_LICENSE_PATH\activate.log | Select-String 'Next license update check is after' | Measure-Object -line | Select-Object -Expand Lines)

    # Set exit code to 0 if activation was successful
    if ($ACTIVATION_SUCCESSFUL -eq 1)
    {
        $UNITY_EXIT_CODE = 0
    }

    # Remove license file
    Remove-Item -Force $FILE_PATH
}
elseif ( ($null -ne ${env:UNITY_SERIAL}) -and ($null -ne ${env:UNITY_EMAIL}) -and ($null -ne ${env:UNITY_PASSWORD}) )
{
    #
    # PROFESSIONAL (SERIAL) LICENSE MODE
    #
    # This will activate unity, using the activating process.
    #
    # Note: This is the preferred way for PROFESSIONAL LICENSES.
    #
    Write-Output "Requesting activation (professional license)"

    # Activate license
    $ACTIVATION_OUTPUT = Start-Process -NoNewWindow -Wait -PassThru "C:\Program Files\Unity\Hub\Editor\${env:UNITY_VERSION}\editor\Unity.exe" -ArgumentList "-batchmode -nographics -logFile $ACTIVATE_LICENSE_PATH\activate.log -quit -serial ${env:UNITY_SERIAL} -username ${env:UNITY_EMAIL} -password ${env:UNITY_PASSWORD}"

    # Store the exit code from the verify command
    $UNITY_EXIT_CODE = $ACTIVATION_OUTPUT.ExitCode
}
else
{
    #
    # NO LICENSE ACTIVATION STRATEGY MATCHED
    #
    # This will exit since no activation strategies could be matched.
    #
    Write-Output "License activation strategy could not be determined."
    Write-Output ""
    Write-Output "Visit https://game.ci/docs/github/getting-started for more"
    Write-Output "details on how to set up one of the possible activation strategies."

    # Immediately exit as no UNITY_EXIT_CODE can be derived.
    exit 1;
}

#
# Display information about the result
#
Get-Content $ACTIVATE_LICENSE_PATH\activate.log
if ($UNITY_EXIT_CODE -eq 0)
{
    # Activation was a success
    Write-Output "Activation complete."
}
else
{
    # Activation failed so exit with the code from the license verification step
    Write-Output "Unclassified error occured while trying to activate license."
    Write-Output "Exit code was: $UNITY_EXIT_CODE"
    exit $UNITY_EXIT_CODE
}

# Return to previous working directory
Pop-Location
