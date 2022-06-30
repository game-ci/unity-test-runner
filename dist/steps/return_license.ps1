# Run in ACTIVATE_LICENSE_PATH directory
Write-Output "Changing to $ACTIVATE_LICENSE_PATH directory."
Push-Location "$ACTIVATE_LICENSE_PATH"

if ($null -ne ${env:UNITY_SERIAL})
{
    #
    # PROFESSIONAL (SERIAL) LICENSE MODE
    #
    # This will return the license that is currently in use.
    #
    $RETURN_OUTPUT = Start-Process -NoNewWindow -Wait -PassThru "C:\Program Files\Unity\Hub\Editor\${env:UNITY_VERSION}\editor\Unity.exe" -ArgumentList "-batchmode -nographics -logFile $FULL_ARTIFACTS_PATH\deactivate.log -quit -returnlicense"

    Get-Content $FULL_ARTIFACTS_PATH\deactivate.log
}

# Return to previous working directory
Pop-Location
