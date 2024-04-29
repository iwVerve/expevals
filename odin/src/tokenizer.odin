package main

import "core:strings"
import "core:strconv"

@(private="file")
is_digit :: proc(char: rune) -> bool {
    return (char >= '0' && char <= '9')
}

@(private="file")
get_operator :: proc(char: rune) -> (bool, Operator) {
    operator: Operator
    switch char {
        case '+': operator = .Add
        case '-': operator = .Subtract
        case '*': operator = .Multiply
        case '/': operator = .Divide
        case: return false, nil
    }
    return true, operator
}

@(private="file")
get_special :: proc(char: rune) -> (bool, Special) {
    special: Special
    switch char {
        case '(': special = .ParenL
        case ')': special = .ParenR
        case: return false, nil
    }
    return true, special
}

tokenize :: proc(source: string) -> [dynamic]Token {
    tokens: [dynamic]Token

    reading_integer := false
    builder: strings.Builder

    for char in source {
        if reading_integer {
            if is_digit(char) {
                strings.write_rune(&builder, char)
                continue
            }
            else {
                token: IntegerLiteral = strconv.atoi(strings.to_string(builder))
                append(&tokens, token)
                strings.builder_reset(&builder)
                reading_integer = false
            }
        }
        if is_digit(char) {
            strings.write_rune(&builder, char)
            reading_integer = true
        }
        else if is_operator, operator := get_operator(char); is_operator {
            append(&tokens, operator)
        }
        else if is_special, special := get_special(char); is_special {
            append(&tokens, special)
        }
    }

    if reading_integer {
        token: IntegerLiteral = strconv.atoi(strings.to_string(builder))
        append(&tokens, token)
    }

    return tokens
}
