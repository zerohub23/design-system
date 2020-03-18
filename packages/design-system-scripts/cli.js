#!/usr/bin/env node

const path = require('path');
const yargs = require('yargs');

// The yargs library actually made it so you have to access `.argv` at the end
// or else it won't do anything. Not sure what the reasoning there was.
// eslint-disable-next-line no-unused-expressions
yargs
  .usage('Usage: $0 <command> [options]')
  .option('skipLatest', {
    default: false,
    description:
      'Use this option when collecting stats on output files that do not yet exist in the latest release'
  })
  .command({
    command: '*',
    handler: () => {
      yargs.showHelp();
    }
  })
  .command({
    command: 'build <sourcePackageDir>',
    desc: 'Builds the JavaScript and Sass for your main design-system package',
    builder: yargs => {
      describeSourcePackageDir(yargs);
    },
    handler: async argv => {
      const { build } = require('./gulp/build');
      await build(argv.sourcePackageDir, { ...argv });
    }
  })
  .command({
    command: 'build-docs <sourcePackageDir> <docsPackageDirs..>',
    desc: 'Builds your main design-system package and its corresponding documentation site',
    builder: yargs => {
      describeSourcePackageDir(yargs);
      describeDocsPackageDirs(yargs);

      yargs
        .option('rootPath', {
          default: '',
          description:
            'The path of the docs site relative to the domain root. For example, if your docs site is hosted at www.domain.com/design/ your rootPath would be `design/`'
        })
        .option('githubUrl', {
          default: '',
          description:
            'The base path for your GitHub repository URLs. This is used to render links to releases, issues, etc.'
        });
    },
    handler: async argv => {
      const { buildDocs } = require('./gulp/build');
      await buildDocs(argv.sourcePackageDir, argv.docsPackageDirs, { ...argv });
    }
  })
  .demandCommand()
  // .command({
  //   command: 'start <sourcePackageDir> <docsPackageDirs..>',
  //   desc: 'Builds and hosts the docs site locally with a webpack dev server, watching for changes in either the design-system source package or the docs package and rebuilding and refreshing appropriately',
  //   builder: yargs => {
  //     describeSourcePackageDir(yargs);
  //     describeDocsPackageDirs(yargs);
  //   },
  //   handler: argv => {
  //     const shared = require('./gulp/shared')(argv);
  //
  //   }
  // })
  .help().argv;

function describeSourcePackageDir(yargs) {
  yargs.positional('sourcePackageDir', {
    desc: 'The relative path to your main design-system package (that contains a src directory)',
    type: 'string',
    coerce: dir => path.resolve(dir)
  });
}

function describeDocsPackageDirs(yargs) {
  yargs.positional('docsPackageDirs..', {
    desc:
      'The relative paths to one or more docs-package directories. The first directory will be the default set of docs, and every docs directory specified after it will override files in the previous one, where the rightmost directory path takes the most precedence. The built documentation site will be saved to the "dist" directory of the final path in this list.',
    type: 'string',
    coerce: dirs => dirs.map(dir => path.resolve(dir))
  });
}
