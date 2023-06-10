import * as core from '@actions/core';
import fs from 'fs';

class LicensingServerSetup {
  public static Setup(unityLicensingServer, actionFolder: string) {
    const servicesConfigPath = `${actionFolder}/unity-config/services-config.json`;
    const servicesConfigPathTemplate = `${servicesConfigPath}.template`;
    if (!fs.existsSync(servicesConfigPathTemplate)) {
      core.error(`Missing services config ${servicesConfigPathTemplate}`);

      return;
    }

    let servicesConfig = fs.readFileSync(servicesConfigPathTemplate).toString();
    servicesConfig = servicesConfig.replace('%URL%', unityLicensingServer);
    fs.writeFileSync(servicesConfigPath, servicesConfig);
  }
}

export default LicensingServerSetup;
