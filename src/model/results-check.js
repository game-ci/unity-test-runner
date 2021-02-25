import * as core from '@actions/core';
import * as github from '@actions/github';
import * as fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import ResultsParser from './results-parser';
import { RunMeta } from './ts/meta.ts';

class ResultsCheck {
  static async createCheck(artifactsPath, checkName, githubToken) {
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
    const runSummary = new RunMeta('Test Results');
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

    // Call GitHub API
    await ResultsCheck.requestGitHubCheck(checkName, githubToken, runs, runSummary);
    return runSummary.failed;
  }

  static async requestGitHubCheck(checkName, githubToken, runs, runSummary) {
    const pullRequest = github.context.payload.pull_request;
    const headSha = (pullRequest && pullRequest.head.sha) || github.context.sha;

    const title = runSummary.summary;
    const summary = await ResultsCheck.renderSummary(runs);
    const details = await ResultsCheck.renderDetails(runs);
    const annotations = runSummary.extractAnnotations();

    core.info(`Posting results for ${headSha}`);
    const createCheckRequest = {
      ...github.context.repo,
      name: checkName,
      head_sha: headSha,
      status: 'completed',
      conclusion: 'neutral',
      output: {
        title,
        summary,
        text: details,
        annotations: annotations.slice(0, 50),
      },
    };

    const octokit = github.getOctokit(githubToken);
    await octokit.checks.create(createCheckRequest);
  }

  static async renderSummary(runMetas) {
    return ResultsCheck.render(`${__dirname}/../views/summary.hbs`, runMetas);
  }

  static async renderDetails(runMetas) {
    return ResultsCheck.render(`${__dirname}/../views/details.hbs`, runMetas);
  }

  static async render(viewPath, runMetas) {
    Handlebars.registerHelper('indent', toIndent =>
      toIndent
        .split('\n')
        .map(s => `        ${s}`)
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
