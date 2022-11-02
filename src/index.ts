import { basename } from 'path';

import { run as main } from './main';
import { run as post } from './post';

/*
 * GitHub Action can provide multiple executable entrypoints (pre, main, post),
 * but it is complicated process to generate multiple `.js` files with `ncc`.
 * So we rather generate just one entrypoint, that is symlinked to multiple locations (main.js and post.js).
 * Then when GitHub Action Runner executes it as `node path/to/main.js` and `node path/to/post.js`,
 * it can read arguments it was executed with and decide which file to execute.
 * The argv[0] is going to be a full path to `node` executable and
 * the argv[1] is going to be the full path to the script.
 * In case index.js would be marked executable and executed directly without the argv[1] it defaults to "main.js".
 */
async function run([_, name = 'main.js']: string[]) {
  const script = basename(name);

  switch (script) {
    case 'main.js':
      await main();
      break;
    case 'post.js':
      await post();
      break;
    default:
      throw new Error(`Unknown script argument: '${script}'`);
  }
}

run(process.argv);
