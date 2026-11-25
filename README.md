# @grafctory/core

[![npm][npm-badge]][npm]

[npm-badge]: https://img.shields.io/npm/v/@grafctory/core
[npm]: https://www.npmjs.com/package/@grafctory/core
[grafctory]: https://github.com/grafctory

Essential TypeScript abstractions.

**@grafctory/core** is the foundation module of the [Grafctory][grafctory] model-driven knowledge graph framework. It
offers clean, minimalist APIs for built-in types, runtime services, functional patterns and web standards.

# Installation

```shell
npm install @grafctory/core
```

> [!WARNING]
>
> TypeScript consumers must use `"moduleResolution": "nodenext"/"node16"/"bundler"` in `tsconfig.json`.
> The legacy `"node"` resolver is not supported.

# Usage

| Module                              | Description                                         |
|-------------------------------------|-----------------------------------------------------|
| [@grafctory/core][core]              | Core types, guards, and utilities                   |
| **Built-in Types**                  |                                                     |
| [@grafctory/core/values][values]     | General-purpose value operations                    |
| [@grafctory/core/numbers][numbers]   | General-purpose number operations                   |
| [@grafctory/core/strings][strings]   | General-purpose string operations                   |
| [@grafctory/core/arrays][arrays]     | General-purpose array operations                    |
| **Runtime Services**                |                                                     |
| [@grafctory/core/async][async]       | Asynchronous execution                              |
| [@grafctory/core/scope][scope]       | Unique value allocation                             |
| [@grafctory/core/bucket][bucket]     | Bulk content storage                                |
| **Functional Patterns**             |                                                     |
| [@grafctory/core/order][order]       | Composable comparison functions                     |
| [@grafctory/core/trace][trace]       | Composable value validators                         |
| [@grafctory/core/relay][relay]       | Type-safe discriminated union switching             |
| [@grafctory/core/state][state]       | Type-safe immutable state management                |
| **Web Standards**                   |                                                     |
| [@grafctory/core/resource][resource] | RFC 3987 resource identifiers                       |
| [@grafctory/core/language][language] | BCP 47 tags, RFC 4647 ranges and language detection |
| [@grafctory/core/datatype][datatype] | XSD 1.1 datatype identifiers                        |
| [@grafctory/core/base64][base64]     | RFC 4648 base64 encoders and decoders               |

[core]: https://grafctory.github.io/core/modules.html

[values]: https://grafctory.github.io/core/modules/values.html

[numbers]: https://grafctory.github.io/core/modules/numbers.html

[strings]: https://grafctory.github.io/core/modules/strings.html

[arrays]: https://grafctory.github.io/core/modules/arrays.html

[async]: https://grafctory.github.io/core/modules/async.html

[scope]: https://grafctory.github.io/core/modules/scope.html

[bucket]: https://grafctory.github.io/core/modules/bucket.html

[order]: https://grafctory.github.io/core/modules/order.html

[trace]: https://grafctory.github.io/core/modules/trace.html

[relay]: https://grafctory.github.io/core/modules/relay.html

[state]: https://grafctory.github.io/core/modules/state.html

[resource]: https://grafctory.github.io/core/modules/resource.html

[language]: https://grafctory.github.io/core/modules/language.html

[datatype]: https://grafctory.github.io/core/modules/datatype.html

[base64]: https://grafctory.github.io/core/modules/base64.html


# Support

- open an [issue](https://github.com/grafctory/core/issues) to report a problem or to suggest a new feature
- start a [discussion](https://github.com/grafctory/core/discussions) to ask a how-to question or to share an idea

# License

This project is licensed under the Apache 2.0 License –
see [LICENSE](https://github.com/grafctory/core?tab=Apache-2.0-1-ov-file) file for details.

<sub>Grafctory™ is a trademark of Metreeca srl.</sub>
