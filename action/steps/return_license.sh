#!/usr/bin/env bash

# Run in ACTIVATE_LICENSE_PATH directory
ACTIVATE_LICENSE_PATH="$GITHUB_WORKSPACE/_activate-license"
echo "Changing to \"$ACTIVATE_LICENSE_PATH\" directory."
pushd "$ACTIVATE_LICENSE_PATH"

if [[ -n "$UNITY_SERIAL" ]]; then
  #
  # PROFESSIONAL (SERIAL) LICENSE MODE
  #
  # This will return the license that is currently in use.
  #
  unity-editor \
    -batchmode \
    -nographics \
    -logFile /dev/stdout \
    -quit \
    -returnlicense
fi

# Return to previous working directory
popd

# Deleting ACTIVATE_LICENSE_PATH directory
echo "Deleting \"$ACTIVATE_LICENSE_PATH\" directory."
rm -r "$ACTIVATE_LICENSE_PATH"
