```yaml
name: Migration Warning

on: [pull_request]

jobs:
  Warning:
    name: Unsafe Migration Check
    runs-on: ubuntu-latest
    steps:
      - uses: ianmitchell/prisma-migration-warning-action@main
        with:
          fail: true
```
