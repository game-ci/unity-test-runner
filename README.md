# Unity - Test runner

[![Actions status](https://github.com/webbertakken/unity-test-runner/workflows/Actions%20%F0%9F%98%8E/badge.svg)](https://github.com/webbertakken/unity-test-runner/actions?query=branch%3Amaster+workflow%3A%22Actions+%F0%9F%98%8E%22)

---

GitHub Action to
[run tests](https://github.com/marketplace/actions/unity-test-runner)
for any Unity project.

Part of the
[Unity Actions](https://github.com/webbertakken/unity-actions)
collection.

---

This is a recommended step to prepare your pipeline for using the
[Build](https://github.com/webbertakken/unity-actions#build)
action.

## Documentation

See the
[Unity Actions](https://github.com/webbertakken/unity-actions)
collection repository for workflow documentation and reference implementation.

## Usage

#### Setup test runner

By default the test runner will run all your playmode and editmode tests.

Create or edit the file called `.github/workflows/main.yml` and add a job to it.

##### Personal License

Personal licenses require a one-time manual activation step (per unity version).

Make sure you
[acquire and activate](https://github.com/marketplace/actions/unity-request-activation-file)
your license file and add it as a secret.

Then, define the test step as follows:

```yaml
- uses: webbertakken/unity-test-runner@v1.2
  id: myTestStep
  env:
    UNITY_LICENSE: ${{ secrets.UNITY_LICENSE }}
  with:
    projectPath: path/to/your/project
    unityVersion: 20XX.X.XXXX
```

##### Professional license

Professional licenses do not need any manual steps.

Instead, three variables will need to be set.

- `UNITY_EMAIL` (should contain the email address for your Unity account)
- `UNITY_PASSWORD` (the password that you use to login to Unity)
- `UNITY_SERIAL` (the serial provided by Unity)

Define the test step as follows:

```yaml
- uses: webbertakken/unity-test-runner@v1.2
  id: myTestStep
  env:
    UNITY_EMAIL: ${{ secrets.UNITY_EMAIL }}
    UNITY_PASSWORD: ${{ secrets.UNITY_PASSWORD }}
    UNITY_SERIAL: ${{ secrets.UNITY_SERIAL }}
  with:
    projectPath: path/to/your/project
    unityVersion: 20XX.X.XXXX
```

That is all you need to test your project.

#### Storing test results

To be able to access the test results,
they need to be uploaded as artifacts.
To do this it is recommended to use Github Actions official
[upload artifact action](https://github.com/marketplace/actions/upload-artifact)
after any test action.

###### Using defaults

By default, Test Runner outputs it's results to a folder named `artifacts`.

Example:

```yaml
- uses: actions/upload-artifact@v1
  with:
    name: Test results
    path: artifacts
```

Test results can now be downloaded as Artifacts in the Actions tab.

###### Specifying artifacts folder

If a different `artifactsPath` was specified in the test runner,
you can reference this path using the `id` of the test step.

Example:

```yaml
- uses: actions/upload-artifact@v1
  with:
    name: Test results
    path: ${{ steps.myTestStep.outputs.artifactsPath }}
```

#### Caching

In order to make test runs (and builds) faster,
you can cache Library files from previous runs.
To do so, simply add Github Actions' official
[cache action](https://github.com/marketplace/actions/cache)
before any unity steps.

Example:

```yaml
- uses: actions/cache@v1.1.0
  with:
    path: path/to/your/project/Library
    key: Library-MyProjectName-TargetPlatform
    restore-keys: |
      Library-MyProjectName-
      Library-
```

This simple addition could speed up your test runs by more than 50%.

#### Complete example

A complete workflow that tests all modes separately could look like this:

```yaml
name: Build project

on:
  pull_request: {}
  push: { branches: [master] }

env:
  UNITY_LICENSE: ${{ secrets.UNITY_LICENSE }}

jobs:
  testAllModes:
    name: Test in ${{ matrix.testMode }} on version ${{ matrix.unityVersion }}
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        projectPath:
          - path/to/your/project
        unityVersion:
          - 2019.2.11f1
        testMode:
          - playmode
          - editmode
    steps:
      - uses: actions/checkout@v2
        with:
          lfs: true
      - uses: actions/cache@v1.1.0
        with:
          path: ${{ matrix.projectPath }}/Library
          key: Library-${{ matrix.projectPath }}
          restore-keys: |
            Library-
      - uses: webbertakken/unity-test-runner@v1.2
        id: tests
        with:
          projectPath: ${{ matrix.projectPath }}
          unityVersion: ${{ matrix.unityVersion }}
          artifactsPath: ${{ matrix.testMode }}-artifacts
      - uses: actions/upload-artifact@v1
        with:
          name: Test results for ${{ matrix.testMode }}
          path: ${{ steps.tests.outputs.artifactsPath }}
```

> **Note:** _Environment variables are set for all jobs in the workflow like this._

## Configuration options

Below options can be specified under `with:` for the `unity-test-runner` action.

#### projectPath

Specify the path to your Unity project to be tested.
The path should be relative to the root of your project.

_**required:** `false`_
_**default:** `<your project root>`_

#### unityVersion

Version of Unity to use for testing the project.

_**required:** `false`_
_**default:** `2019.2.1f11`_

#### testMode

The type of tests to be run by the test runner.

Options are: "all", "playmode", "editmode"

_**required:** `false`_
_**default:** `all`_

#### artifactsPath

Path where the test results should be stored.

In this folder a folder will be created for every test mode.

_**required:** `false`_
_**default:** `artifacts`_

#### customParameters

Custom parameters to configure the test runner.

Parameters must start with a hyphen (`-`) and may be followed by a value (without hyphen).

Parameters without a value will be considered booleans (with a value of true).

_**example:**_

```yaml
- uses: webbertakken/unity-test-runner@master
  with:
    customParameters: -profile SomeProfile -someBoolean -someValue exampleValue
```

_**required:** `false`_
_**default:** ""_

## More actions

Visit
[Unity Actions](https://github.com/webbertakken/unity-actions)
to find related actions for Unity.

Feel free to contribute.

## Licence

[MIT](./LICENSE)
