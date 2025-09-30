# compare-screenshots

A command-line utility and node.js library to take and compare screenshots of the given URLs.

This utility built to quickly taking and comparing screenshots of two URLs so you might spot the differences much easier than doing it manually.

## Installation

```sh
npm i -g compare-screenshots
```

## Usage

```sh
compare-screenshots https://example.com/foo https://example.com/bar

compare-screenshots --no-headless https://example.com/foo https://example.com/bar

compare-screenshots --out-dir ./screenshots https://example.com/foo https://example.com/bar
```
