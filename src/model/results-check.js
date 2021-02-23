import * as core from '@actions/core';
import * as github from '@actions/github';
import * as fs from 'fs';
import * as xmljs from 'xml-js';
import path from 'path';
import Handlebars from 'handlebars';
import ReportConverter from './report-converter';
import { RunMeta } from './ts/meta.ts';

class ResultsCheck {
  static async publishResults(artifactsPath, githubToken) {
    // Parse all reports
    const runs = [];
    const files = fs.readdirSync(artifactsPath);
    await Promise.all(
      files.map(async filepath => {
        if (!filepath.endsWith('.xml')) return;
        core.info(`Processing file ${filepath}...`);
        const fileData = await ResultsCheck.parseReport(path.join(artifactsPath, filepath));
        core.info(fileData.summary);
        runs.push(fileData);
      }),
    );

    // Prepare run summary
    const runSummary = new RunMeta('Test Results');
    runs.forEach(run => {
      runSummary.total += run.total;
      runSummary.passed += run.passed;
      runSummary.skipped += run.skipped;
      runSummary.failed += run.failed;
      runSummary.duration += run.duration;
      core.debug(`Run suites length ${run.suites.length}`);
      run.suites.forEach(suite => {
        runSummary.addTests(suite.tests);
      });
    });

    // Log run summary
    core.info('=================');
    core.info('Analyze result:');
    core.info(runSummary.summary);

    // Create check
    await ResultsCheck.createCheck(githubToken, runs, runSummary, runSummary.extractAnnotations());
  }

  static async parseReport(filepath) {
    core.info(`Trying to open ${filepath}`);
    const file = await fs.promises.readFile(filepath, 'utf8');
    const report = xmljs.xml2js(file, { compact: true });
    core.info(`File ${filepath} parsed...`);

    return ReportConverter.convertReport(path.basename(filepath), report);
  }

  static async createCheck(githubToken, runs, runSummary, annotations) {
    const pullRequest = github.context.payload.pull_request;
    const headSha = (pullRequest && pullRequest.head.sha) || github.context.sha;

    const summary = await ResultsCheck.renderSummary(runs);
    const text = await ResultsCheck.renderText(runs);
    const title = runSummary.summary;

    core.info(`Posting results for ${headSha}`);
    const createCheckRequest = {
      ...github.context.repo,
      name: 'Test Results',
      head_sha: headSha,
      status: 'completed',
      conclusion: 'neutral',
      output: {
        title,
        summary,
        text,
        annotations: annotations.slice(0, 50),
      },
    };

    const octokit = github.getOctokit(githubToken);
    await octokit.checks.create(createCheckRequest);
  }

  static async renderSummary(runMetas) {
    return ResultsCheck.render(`${__dirname}/../views/summary.hbs`, runMetas);
  }

  static async renderText(runMetas) {
    return ResultsCheck.render(`${__dirname}/../views/text.hbs`, runMetas);
  }

  static async render(viewPath, runMetas) {
    const source = await fs.promises.readFile(viewPath, 'utf8');
    Handlebars.registerHelper('indent', ResultsCheck.indentHelper);
    const template = Handlebars.compile(source);
    return template(
      { runs: runMetas },
      {
        allowProtoMethodsByDefault: true,
        allowProtoPropertiesByDefault: true,
      },
    );
  }

  static indentHelper(argument) {
    return argument
      .split('\n')
      .map(s => `        ${s}`)
      .join('\n');
  }
}

export default ResultsCheck;
