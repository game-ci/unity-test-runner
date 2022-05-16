import Platform from './platform';

class ImageTag {
  public customImage?: string;
  public repository: string;
  public name: string;
  public editorVersion: string;
  public targetPlatform: string;
  public targetPlatformSuffix: string;
  public imagePlatformPrefix: string;
  public imageRollingVersion: number;

  constructor(imageProperties) {
    const {
      editorVersion = '2019.2.11f1',
      targetPlatform = Platform.types.StandaloneLinux64,
      customImage,
    } = imageProperties;

    if (!ImageTag.versionPattern.test(editorVersion)) {
      throw new Error(`Invalid version "${editorVersion}".`);
    }

    // Either
    this.customImage = customImage;

    // Or
    this.repository = 'unityci';
    this.name = 'editor';
    this.editorVersion = editorVersion;
    this.targetPlatform = targetPlatform;
    this.targetPlatformSuffix = ImageTag.getTargetPlatformSuffix(targetPlatform, editorVersion);
    this.imagePlatformPrefix = ImageTag.getImagePlatformPrefix(process.platform);
    this.imageRollingVersion = 1;
  }

  static get versionPattern() {
    return /^20\d{2}\.\d\.\w{3,4}|3$/;
  }

  static get targetPlatformSuffixes() {
    return {
      generic: '',
      webgl: 'webgl',
      mac: 'mac-mono',
      windows: 'windows-mono',
      linux: 'base',
      linuxIl2cpp: 'linux-il2cpp',
      android: 'android',
      ios: 'ios',
      facebook: 'facebook',
    };
  }

  static getImagePlatformPrefix(platform) {
    switch (platform) {
      case 'linux':
        return 'ubuntu';
      case 'win32':
        return 'windows';
      default:
        throw new Error('The Operating System of this runner is not yet supported.');
    }
  }

  static getTargetPlatformSuffix(targetPlatform, editorVersion) {
    const { generic, webgl, mac, windows, linux, linuxIl2cpp, android, ios, facebook } =
      ImageTag.targetPlatformSuffixes;

    const [major, minor] = editorVersion.split('.').map(digit => Number(digit));
    // @see: https://docs.unity3d.com/ScriptReference/BuildTarget.html
    switch (targetPlatform) {
      case Platform.types.StandaloneOSX:
        return mac;
      case Platform.types.StandaloneWindows:
        return windows;
      case Platform.types.StandaloneWindows64:
        return windows;
      case Platform.types.StandaloneLinux64: {
        // Unity versions before 2019.3 do not support il2cpp
        if (major >= 2020 || (major === 2019 && minor >= 3)) {
          return linuxIl2cpp;
        }
        return linux;
      }
      case Platform.types.iOS:
        return ios;
      case Platform.types.Android:
        return android;
      case Platform.types.WebGL:
        return webgl;
      case Platform.types.WSAPlayer:
        return windows;
      case Platform.types.PS4:
        return windows;
      case Platform.types.XboxOne:
        return windows;
      case Platform.types.tvOS:
        return windows;
      case Platform.types.Switch:
        return windows;
      // Unsupported
      case Platform.types.Lumin:
        return windows;
      case Platform.types.BJM:
        return windows;
      case Platform.types.Stadia:
        return windows;
      case Platform.types.Facebook:
        return facebook;
      case Platform.types.NoTarget:
        return generic;

      // Test specific
      case Platform.types.Test:
        return generic;
      default:
        throw new Error(`
          Platform must be one of the ones described in the documentation.
          "${targetPlatform}" is currently not supported.`);
    }
  }

  get tag() {
    const versionAndTarget = `${this.editorVersion}-${this.targetPlatformSuffix}`.replace(
      /-+$/,
      '',
    );

    return `${this.imagePlatformPrefix}-${versionAndTarget}-${this.imageRollingVersion}`;
  }

  get image() {
    return `${this.repository}/${this.name}`.replace(/^\/+/, '');
  }

  toString() {
    const { image, tag, customImage } = this;

    if (customImage) return customImage;

    return `${image}:${tag}`;
  }
}

export default ImageTag;
