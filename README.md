A very simple action that checks PRs to see if a Prisma schema has lines removed and if there are non Prisma file changes in the PR. If both conditions are true, it will post a configurable message or fail the check.

You may want this to ensure minimal downtime or deploy errors, but it isn't always accurate. It should be used as a loose rule. This is my first stab at the action; it could definitely be improved!

## Usage

```yaml
name: Migration Warning

on: [pull_request]

jobs:
  Warning:
    name: Unsafe Migration Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
        with:
          fetch-depth: 0
      - uses: ianmitchell/prisma-migration-warning-action@main
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          # Options go here
          fail: true
```

## Options

- `main-branch` [OPTIONAL] - the name of the main branch (sometimes master). Defaults to `main`.
- `path` [OPTIONAL] - the path to the Prisma directory. Defaults to `prisma`.
- `warning` [OPTIONAL] - whether to post a warning comment or not in the PR. Defaults to `true`.
- `message` [OPTIONAL] - the message to post in the PR. Defaults to a generic warning message.
- `repeat` [OPTIONAL] - whether to post a warning comment every time the action is run. Defaults to `false`.
- `fail` [OPTIONAL] - whether to fail the PR check if the action fails. Defaults to `false`.
