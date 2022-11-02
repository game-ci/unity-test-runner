import * as core from '@actions/core';
import Action from './model/action';
import { Docker } from './model';

export async function run() {
  try {
    const parameters = Action.runnerContext();
    await Docker.ensureContainerRemoval(parameters);
  } catch (error: any) {
    core.setFailed(error.message);
  }
}
