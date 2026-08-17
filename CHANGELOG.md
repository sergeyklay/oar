# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Security

- Updated the Next.js runtime to 16.3.1, patching high-severity advisories in request handling and Server Actions: middleware bypass in the App Router, server-side request forgery, response-body cache confusion, and unauthenticated disclosure of internal Server Function endpoints. The same upgrade patches the bundled `postcss` (XSS via unescaped `</style>` in stringify output, and arbitrary `.map` file disclosure via `sourceMappingURL`), `sharp` (inherited libvips CVE-2026-33327, CVE-2026-33328, CVE-2026-35590, CVE-2026-35591), and `nanoid` (non-terminating generators on zero or negative size). ([#535](https://github.com/sergeyklay/oar/pull/535))

[Unreleased]: https://github.com/sergeyklay/oar/compare/v0.1.0...HEAD
