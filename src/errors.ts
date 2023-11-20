export default class AppError extends Error {
  static LibraryUsageNotFound(libraryName: string): AppError {
    return new AppError(`Usage of library '${libraryName}' is not found in package.json`);
  }

  static FileNotFound(path: string): AppError {
    return new AppError(`File at '${path}' is not found`);
  }

  static InvalidVersionFormat(libraryVersion: string): AppError {
    return new AppError(`Library version '${libraryVersion}' is not valid version number (x.y.z)`);
  }

  static MaybeLibraryDowngrade(currentVersion: string, newVersion: string): AppError {
    throw new AppError(`Current library version '${currentVersion}' looks to be greater than supplied version '${newVersion}'`);
  }

  static MissingScriptArgument(argumentName: string): AppError {
    throw new AppError(`Missing required script argument: '${argumentName}'`);
  }
}
