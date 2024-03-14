class ImageEnvironmentFactory {
  public static getEnvVarString(parameters) {
    const environmentVariables = ImageEnvironmentFactory.getEnvironmentVariables(parameters);
    let string = '';
    for (const p of environmentVariables) {
      if (p.value === '' || p.value === undefined) {
        continue;
      }
      if (p.name !== 'ANDROID_KEYSTORE_BASE64' && p.value.toString().includes(`\n`)) {
        string += `--env ${p.name} `;
        process.env[p.name] = p.value.toString();
        continue;
      }

      string += `--env ${p.name}="${p.value}" `;
    }

    return string;
  }

  public static getEnvironmentVariables(parameters) {
    let environmentVariables = [
      { name: 'UNITY_EMAIL', value: process.env.UNITY_EMAIL },
      { name: 'UNITY_PASSWORD', value: process.env.UNITY_PASSWORD },
      { name: 'UNITY_SERIAL', value: parameters.unitySerial },
      {
        name: 'UNITY_LICENSING_SERVER',
        value: parameters.unityLicensingServer,
      },
      { name: 'UNITY_VERSION', value: parameters.editorVersion },
      {
        name: 'USYM_UPLOAD_AUTH_TOKEN',
        value: process.env.USYM_UPLOAD_AUTH_TOKEN,
      },
      { name: 'PROJECT_PATH', value: parameters.projectPath },
      { name: 'COVERAGE_OPTIONS', value: parameters.coverageOptions },
      { name: 'COVERAGE_RESULTS_PATH', value: 'CodeCoverage' },
      { name: 'ARTIFACTS_PATH', value: parameters.artifactsPath },
      { name: 'PACKAGE_MODE', value: parameters.packageMode },
      { name: 'PACKAGE_NAME', value: parameters.packageName },
      { name: 'SCOPED_REGISTRY_URL', value: parameters.scopedRegistryUrl },
      { name: 'REGISTRY_SCOPES', value: parameters.registryScopes },
      { name: 'PRIVATE_REGISTRY_TOKEN', value: process.env.UPM_REGISTRY_TOKEN },
      { name: 'GIT_PRIVATE_TOKEN', value: parameters.gitPrivateToken },
      { name: 'VERSION', value: parameters.buildVersion },
      { name: 'CUSTOM_PARAMETERS', value: parameters.customParameters },
      { name: 'RUN_AS_HOST_USER', value: parameters.runAsHostUser },
      { name: 'CHOWN_FILES_TO', value: parameters.chownFilesTo },
      { name: 'GITHUB_REF', value: process.env.GITHUB_REF },
      { name: 'GITHUB_SHA', value: process.env.GITHUB_SHA },
      { name: 'GITHUB_REPOSITORY', value: process.env.GITHUB_REPOSITORY },
      { name: 'GITHUB_ACTOR', value: process.env.GITHUB_ACTOR },
      { name: 'GITHUB_WORKFLOW', value: process.env.GITHUB_WORKFLOW },
      { name: 'GITHUB_HEAD_REF', value: process.env.GITHUB_HEAD_REF },
      { name: 'GITHUB_BASE_REF', value: process.env.GITHUB_BASE_REF },
      { name: 'GITHUB_EVENT_NAME', value: process.env.GITHUB_EVENT_NAME },
      { name: 'GITHUB_ACTION', value: process.env.GITHUB_ACTION },
      { name: 'GITHUB_EVENT_PATH', value: process.env.GITHUB_EVENT_PATH },
      { name: 'RUNNER_OS', value: process.env.RUNNER_OS },
      { name: 'RUNNER_TOOL_CACHE', value: process.env.RUNNER_TOOL_CACHE },
      { name: 'RUNNER_TEMP', value: process.env.RUNNER_TEMP },
      { name: 'RUNNER_WORKSPACE', value: process.env.RUNNER_WORKSPACE },
    ];

    for (const variable of environmentVariables) {
      if (
        environmentVariables.some(
          x => variable !== undefined && variable.name !== undefined && x.name === variable.name,
        ) === undefined
      ) {
        environmentVariables = environmentVariables.filter(x => x !== variable);
      }
    }

    if (parameters.sshAgent) {
      environmentVariables.push({ name: 'SSH_AUTH_SOCK', value: '/ssh-agent' });
    }

    return environmentVariables;
  }
}

export default ImageEnvironmentFactory;
