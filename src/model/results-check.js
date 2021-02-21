import * as core from '@actions/core';
import * as github from '@actions/github';
import * as fs from 'fs';
import * as xmljs from 'xml-js';
import Handlebars from 'handlebars';
import ReportConverter from './report-converter';
import { RunMeta } from './ts/meta.ts';

class ResultsCheck {
  static async publishResults(artifactsPath, githubToken) {
    // Parse all reports
    const runs = [];
    const workspace = process.env.GITHUB_WORKSPACE;
    const files = fs.readdirSync(artifactsPath);
    await Promise.all(
      files.map(async filepath => {
        if (!filepath.endsWith('.xml')) return;
        const filename = filepath.replace(workspace, '');
        core.startGroup(`Processing file ${filename}...`);
        const fileData = await ResultsCheck.parseReport(filepath, filename);
        core.info(fileData.summary);
        runs.push(fileData);
        core.endGroup();
      }),
    );

    // Prepare run summary
    const runSummary = new RunMeta('Test Results');
    runs.array.forEach(suite => {
      runSummary.total += suite.total;
      runSummary.passed += suite.passed;
      runSummary.skipped += suite.skipped;
      runSummary.failed += suite.failed;
      runSummary.duration += suite.duration;
      suite.suites.array.forEach(s => {
        runSummary.addTests(s.tests);
      });
    });

    // Log run summary
    core.info('=================');
    core.info('Analyze result:');
    core.info(runSummary.summary);

    // Create check
    await ResultsCheck.createCheck(githubToken, runs, runSummary, runSummary.extractAnnotations());
  }

  static async parseReport(filepath, filename) {
    core.info(`Trying to open ${filepath}`);
    const file = await fs.promises.readFile(filepath, 'utf8');
    const report = xmljs.xml2js(file, { compact: true });
    core.info(`File ${filepath} parsed...`);

    return ReportConverter.convertReport(filename, report);
  }

  static async createCheck(githubToken, runs, runSummary, annotations) {
    const pullRequest = github.context.payload.pull_request;
    const link = (pullRequest && pullRequest.html_url) || github.context.ref;
    const headSha = (pullRequest && pullRequest.head.sha) || github.context.sha;
    const conclusion = runSummary.failed === 0 ? 'success' : 'failure';
    core.info(
      `Posting status 'completed' with conclusion '${conclusion}' to ${link} (sha: ${headSha})`,
    );

    const summary = await ResultsCheck.renderSummary(runs);
    const text = await ResultsCheck.renderText(runs);
    const title = runSummary.summary;
    const createCheckRequest = {
      ...github.context.repo,
      name: 'Test Results',
      head_sha: headSha,
      status: 'completed',
      conclusion,
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
