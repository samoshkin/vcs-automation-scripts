import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import AppError from './errors';

/**
 * Represents input arguments as passed through CLI arguments or env variables
 */
export interface ScriptInputArgs {
  workspace: string;
  repoSlug: string;
  accessToken: string;
  libraryName: string;
  libraryVersion: string;
}


/**
 * Routine that parses app args either from CLI args or env vars
 * and compose them all in a single object
 * @returns
 */
export function parseScriptArgs(): ScriptInputArgs {
  const args = yargs(hideBin(process.argv)).argv;
  const inputs = {
    workspace: args.workspace as string,
    repoSlug: args.reposlug as string,
    libraryName: args.library as string,
    libraryVersion: args.libraryVersion as string,
    accessToken: process.env['BITBUCKET_ACCESS_TOKEN']
  };

  ensureRequiredArgsArePresent(inputs);

  return inputs;
}

// this is very basic validation
// TODO: either define all expected args through yargs.options or use some schema-based validation library
function ensureRequiredArgsArePresent(inputs: ScriptInputArgs) {
  if (!inputs.workspace) {
    throw AppError.MissingScriptArgument('--workspace');
  }

  if (!inputs.repoSlug) {
    throw AppError.MissingScriptArgument('--reposlug');
  }

  if (!inputs.libraryName) {
    throw AppError.MissingScriptArgument('--library-name');
  }

  if (!inputs.libraryVersion) {
    throw AppError.MissingScriptArgument('--library-version');
  }

  if (!inputs.accessToken) {
    throw AppError.MissingScriptArgument('BITBUCKET_ACCESS_TOKEN');
  }
}
