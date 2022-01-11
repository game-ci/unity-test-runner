import * as core from '@actions/core';
import * as fs from 'fs';
import * as github from '@actions/github';
import Handlebars from 'handlebars';
import ResultsParser from './results-parser';
import { RunMeta } from './results-meta';
import path from 'path';

const ResultsCheck = {
  async createCheck(artifactsPath, githubToken, checkName) {
    // Validate input
    if (!fs.existsSync(artifactsPath) || !githubToken || !checkName) {
      throw new Error(
        `Missing input! {"artifactsPath": "${artifactsPath}",  "githubToken": "${githubToken}, "checkName": "${checkName}"`,
      );
    }

    // Parse all results files
    const runs: RunMeta[] = [];
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
    for (const run of runs) {
      runSummary.total += run.total;
      runSummary.passed += run.passed;
      runSummary.skipped += run.skipped;
      runSummary.failed += run.failed;
      runSummary.duration += run.duration;
      for (const suite of run.suites) {
        runSummary.addTests(suite.tests);
      }
    }

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
    core.debug(`Annotations: ${annotations}`);
    const output = {
      title,
      summary,
      text: details,
      annotations: annotations.slice(0, 50),
    };

    // Call GitHub API
    await ResultsCheck.requestGitHubCheck(githubToken, checkName, output);
    return runSummary.failed;
  },

  async requestGitHubCheck(githubToken, checkName, output) {
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
  },

  async renderSummary(runMetas) {
    return ResultsCheck.render(`${__dirname}/results-check-summary.hbs`, runMetas);
  },

  async renderDetails(runMetas) {
    return ResultsCheck.render(`${__dirname}/results-check-details.hbs`, runMetas);
  },

  async render(viewPath, runMetas) {
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
  },
};

export default ResultsCheck;
