/**
 * Represents an application-specific errors
 * which we want to distinguish from all other errors
 */
export default class AppError extends Error {
  /**
   * Thrown when library usage is not found in a package.json file
   * in either of dependencies, devDependencies, peerDependencines
   * @param libraryName
   * @returns
   */
  static LibraryUsageNotFound(libraryName: string): AppError {
    return new AppError(`Usage of library '${libraryName}' is not found in package.json`);
  }

  /**
   * Thrown when file is not found in remote repo
   */
  static FileNotFound(path: string): AppError {
    return new AppError(`File at '${path}' is not found`);
  }

  /**
   * Thrown when library version has invalid format (not an semver compatible 'x.y.z')
   */
  static InvalidVersionFormat(libraryVersion: string): AppError {
    return new AppError(`Library version '${libraryVersion}' is not valid version number (x.y.z)`);
  }

  /**
   * Thrown when new/desired library version is less than the one which is currently used
   * it's going to be an downgrade whereas the intention was to upgrade the version
   */
  static MaybeLibraryDowngrade(currentVersion: string, newVersion: string): AppError {
    throw new AppError(`Current library version '${currentVersion}' looks to be greater than supplied version '${newVersion}'`);
  }

  /**
   * Thrown when require CLI argument is missing
   */
  static MissingScriptArgument(argumentName: string): AppError {
    throw new AppError(`Missing required script argument: '${argumentName}'`);
  }
}
