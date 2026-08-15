# Activates Unity

Write-Output ""
Write-Output "###########################"
Write-Output "#        Activating       #"
Write-Output "###########################"
Write-Output ""

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
    Get-ChildItem -Path $FILE_PATH

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
  # SERIAL LICENSE MODE
  #
  # This will activate unity, using the serial activation process.
  #
  Write-Output "Requesting activation"

  $ACTIVATION_OUTPUT = Start-Process -FilePath "$Env:UNITY_PATH/Editor/Unity.exe" `
                                     -NoNewWindow `
                                     -PassThru `
                                     -ArgumentList  "-batchmode `
                                                     -quit `
                                                     -nographics `
                                                     -username $Env:UNITY_EMAIL `
                                                     -password $Env:UNITY_PASSWORD `
                                                     -serial $Env:UNITY_SERIAL `
                                                     -projectPath c:/BlankProject `
                                                     -logfile -"

  # Cache the handle so exit code works properly
  # https://stackoverflow.com/questions/10262231/obtaining-exitcode-using-start-process-and-waitforexit-instead-of-wait
  $unityHandle = $ACTIVATION_OUTPUT.Handle

  while ($true) {
      if ($ACTIVATION_OUTPUT.HasExited) {
        $ACTIVATION_EXIT_CODE = $ACTIVATION_OUTPUT.ExitCode

        # Display results
        if ($ACTIVATION_EXIT_CODE -eq 0)
        {
            Write-Output "Activation Succeeded"
        } else
        {
            Write-Output "Activation failed, with exit code $ACTIVATION_EXIT_CODE"
        }

        break
      }

      Start-Sleep -Seconds 3
  }
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
    Write-Output "Visit https://game.ci/docs/github/activation for more"
    Write-Output "details on how to set up one of the possible activation strategies."

    Write-Output "::error ::No valid license activation strategy could be determined. Make sure to provide UNITY_EMAIL, UNITY_PASSWORD, and either a UNITY_SERIAL \
or UNITY_LICENSE. See more info at https://game.ci/docs/github/activation"

    $ACTIVATION_EXIT_CODE = 1;
}
