# vcs-automation-scripts

The CLI tool, that allows to upgrade specific library version in project package.json (dependencies, devDependencies, peerDepedencies), and open a pull request.

## Usage

```sh
# build
npm run build

# run
export BITBUCKET_ACCESS_TOKEN="<your_access_token>"
node ./dist/main.js --library <library_name> --library-version <library_version> --workspace <bitbucket_workspace> --reposlug <bitbucket_reposlug>
```

CLI arguments:

- `--library`, the library name that you would like to upgrade
- `--libraryVersion`, the desired library version
- `--workspace`, Bitbucket workspace (e.g alexey_samoshkin)
- `--reposlug`, Bitbucket reposlug (e.g. test)


Make sure to provide Bitbucket repo access token via `BITBUCKET_ACCESS_TOKEN` variable.
