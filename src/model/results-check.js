import * as core from '@actions/core';
import * as github from '@actions/github';
import * as fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import ResultsParser from './results-parser';
import { RunMeta } from './ts/results-meta.ts';

class ResultsCheck {
  static async createCheck(artifactsPath, githubToken, checkName) {
    // Validate input
    if (!fs.existsSync(artifactsPath) || !githubToken || !checkName) {
      throw new Error(
        `Missing input! {"artifactsPath": "${artifactsPath}",  "githubToken": "${githubToken}, "checkName": "${checkName}"`,
      );
    }

    // Parse all results files
    const runs = [];
    const files = fs.readdirSync(artifactsPath);
    await Promise.all(
      files.map(async filepath => {
        if (!filepath.endsWith('.xml')) return;
        core.info(`Processing file ${filepath}...`);
        const fileData = await ResultsParser.parseResults(path.join(artifactsPath, filepath));
        core.info(fileData.summary);
        runs.push(fileData);
      }),
    );

    // Combine all results into a single run summary
    const runSummary = new RunMeta(checkName);
    runs.forEach(run => {
      runSummary.total += run.total;
      runSummary.passed += run.passed;
      runSummary.skipped += run.skipped;
      runSummary.failed += run.failed;
      runSummary.duration += run.duration;
      run.suites.forEach(suite => {
        runSummary.addTests(suite.tests);
      });
    });

    // Log
    core.info('=================');
    core.info('Analyze result:');
    core.info(runSummary.summary);

    // Format output
    const title = runSummary.summary;
    const summary = await ResultsCheck.renderSummary(runs);
    core.debug(`Summary view: ${summary}`);
    const details = await ResultsCheck.renderDetails(runs);
    core.debug(`Details view: ${details}`);
    const rawAnnotations = runSummary.extractAnnotations();
    core.debug(`Raw annotations: ${rawAnnotations}`);
    const annotations = rawAnnotations.map(rawAnnotation => {
      const annotation = rawAnnotation;
      annotation.path = rawAnnotation.path.replace('/github/workspace/', '');
      return annotation;
    });
    core.debug(`Annotations: ${rawAnnotations}`);
    const output = {
      title,
      summary,
      text: details,
      annotations: annotations.slice(0, 50),
    };

    // Call GitHub API
    await ResultsCheck.requestGitHubCheck(githubToken, checkName, output);
    return runSummary.failed;
  }

  static async requestGitHubCheck(githubToken, checkName, output) {
    const pullRequest = github.context.payload.pull_request;
    const headSha = (pullRequest && pullRequest.head.sha) || github.context.sha;

    core.info(`Posting results for ${headSha}`);
    const createCheckRequest = {
      ...github.context.repo,
      name: checkName,
      head_sha: headSha,
      status: 'completed',
      conclusion: 'neutral',
      output,
    };

    const octokit = github.getOctokit(githubToken);
    await octokit.checks.create(createCheckRequest);
  }

  static async renderSummary(runMetas) {
    return ResultsCheck.render(`${__dirname}/../views/results-check-summary.hbs`, runMetas);
  }

  static async renderDetails(runMetas) {
    return ResultsCheck.render(`${__dirname}/../views/results-check-details.hbs`, runMetas);
  }

  static async render(viewPath, runMetas) {
    Handlebars.registerHelper('indent', toIndent =>
      toIndent
        .split('\n')
        .map(s => `        ${s.replace('/github/workspace/', '')}`)
        .join('\n'),
    );
    const source = await fs.promises.readFile(viewPath, 'utf8');
    const template = Handlebars.compile(source);
    return template(
      { runs: runMetas },
      {
        allowProtoMethodsByDefault: true,
        allowProtoPropertiesByDefault: true,
      },
    );
  }
}

export default ResultsCheck;
