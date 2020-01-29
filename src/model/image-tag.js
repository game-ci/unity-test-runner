import { trimStart } from 'lodash-es';

class ImageTag {
  static createForBase(version) {
    const repository = 'gableroux';
    const name = 'unity3d';
    return new this({ repository, name, version });
  }

  static createForAction(version) {
    const repository = '';
    const name = 'unity-action';
    return new this({ repository, name, version });
  }

  constructor({ repository = '', name, version }) {
    if (!ImageTag.versionPattern.test(version)) {
      throw new Error(`Invalid version "${version}".`);
    }

    Object.assign(this, { repository, name, version });
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
    return `${this.image}:${this.tag}`;
  }
}

export default ImageTag;
