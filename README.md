# kshoot.js

This is JavaScript/TypeScript library for manipulating KSH and KSON chart files of K-Shoot Mania. This project supersedes [kson-js](https://github.com/123jimin/kson-js).

Note that this library is focused on having a simple, intuitive codebase with little dependency,
embracing extra costs and suboptimal time complexity (at least while this library is being made).

Extra costs caused by abstraction should be insignificant unless you want to process large amount of files at once, but suboptimal time complexity may impact you if you're trying to edit the chart directly with this library.
Therefore, for applications such as chart editors, use other data structure libraries with this library for better performance.

## Dependencies
```
$ npm ls --prod --all
kshoot@0.0.1
`-- zod@3.20.2
```

## Chart file specs

- [KSH Chart File Format Specification](https://github.com/m4saka/ksm-chart-format-spec/blob/master/ksh_format.md)
- [KSON Format Specification](https://github.com/m4saka/ksm-chart-format-spec/blob/master/kson_format.md)
