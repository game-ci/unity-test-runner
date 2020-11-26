import { trimStart } from 'lodash-es';

class ImageTag {
  static createForBase({ version, customImage }) {
    const repository = 'unityci';
    const name = 'editor';
    return new this({ repository, name, version, customImage });
  }

  static createForAction(version) {
    const repository = '';
    const name = 'unity-action';
    return new this({ repository, name, version });
  }

  constructor({ repository = '', name, version, customImage }) {
    if (!ImageTag.versionPattern.test(version)) {
      throw new Error(`Invalid version "${version}".`);
    }

    Object.assign(this, { repository, name, version, customImage });
  }

  static get versionPattern() {
    return /^20\d{2}\.\d\.\w{3,4}|3$/;
  }

  get tag() {
    return this.version;
  }

  get image() {
    return trimStart(`${this.repository}/${this.name}`, '/');
  }

  toString() {
    if (this.customImage && this.customImage !== '') {
      return this.customImage;
    }

    return `${this.image}:${this.tag}-base-0`;
  }
}

export default ImageTag;
