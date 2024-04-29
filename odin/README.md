### Setup
- `cd` into this folder
- run `run.bat`

### Features
```
> 1 * (2 + 3) * 4
20
```

### Language thoughts
Surprisingly unpleasant. Aesthetically a pretty language, yet `#(private="file")`
and a couple others look horrendous in contrast. Switching on an enum is
strangely strict, requiring some hacky `case: panic("Unreachable")`. No dot
method syntax yet any interaction with the string builder is begging for it.
Error reporting occasionally actively unhelpful over syntactic mistakes.

Honestly just wish I was doing Zig.
