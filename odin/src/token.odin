package main

IntegerLiteral :: int

Operator :: enum {
    Add,
    Subtract,
    Multiply,
    Divide,
}

Special :: enum {
    ParenL,
    ParenR,
}

Token :: union {
    IntegerLiteral,
    Operator,
    Special,
}
