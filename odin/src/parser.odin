package main

@(private="file")
Precedence :: enum {
    Lowest,
    Add,
    Multiply,
    Prefix,
}

@(private="file")
get_precedence :: proc(operator: Operator) -> (Precedence, bool) {
    switch operator {
        case .Add, .Subtract: return .Add, true
        case .Multiply, .Divide: return .Multiply, true
        case: return {}, false
    }
}

@(private="file")
Parser :: struct {
    tokens: [dynamic]Token,
    pos: int,
}

@(private="file")
peek :: proc(parser: ^Parser) -> (Token, bool) {
    if parser.pos >= len(parser.tokens) {
        return {}, false
    }
    return parser.tokens[parser.pos], true
}

@(private="file")
next :: proc(parser: ^Parser) -> (Token, bool) {
    token, ok := peek(parser)
    advance(parser)
    return token, ok
}

@(private="file")
advance :: proc(parser: ^Parser) {
    parser.pos += 1
}

@(private="file")
parse_prefix_expression :: proc(parser: ^Parser) -> (Expression, bool) {
    operator, ok := next(parser)
    if !ok {
        return {}, false
    }
    expression := new(Expression)
    expression^, ok = parse_expression(parser, .Prefix)
    if !ok {
        return {}, false
    }
    return UnaryExpression{operator.(Operator), expression}, true
}

@(private="file")
parse_grouped_expression :: proc(parser: ^Parser) -> (Expression, bool) {
    advance(parser)
    expression, ok := parse_expression(parser, .Lowest)
    if !ok {
        return {}, false
    }
    paren_r: Token
    paren_r, ok = next(parser)
    if !ok {
        return {}, false
    }
    if special, ok := paren_r.(Special); ok {
        if paren_r.(Special) == .ParenR {
            return expression, true
        }
    }
    return {}, false
}

@(private="file")
call_prefix_procedure :: proc(parser: ^Parser) -> (Expression, bool) {
    token, ok := peek(parser)
    if !ok {
        return {}, false
    }
    switch t in token {
        case Operator:
            #partial switch t {
                case .Add, .Subtract: return parse_prefix_expression(parser)
                case: return {}, false
            }
        case Special:
            #partial switch t {
                case .ParenL: return parse_grouped_expression(parser)
                case: return {}, false
            }
        case IntegerLiteral:
            advance(parser)
            return t, true
        case: return {}, false
    }
}

@(private="file")
parse_infix_expression :: proc(parser: ^Parser, left: Expression) -> (Expression, bool) {
    token, ok := next(parser)
    if !ok {
        return {}, false
    }
    operator := token.(Operator)
    precedence: Precedence
    precedence, ok = get_precedence(operator)
    if !ok {
        return {}, false
    }
    left_p := new(Expression)
    left_p^ = left
    right := new(Expression)
    right^, ok = parse_expression(parser, precedence)
    if !ok {
        return {}, false
    }
    return BinaryExpression{left_p, operator, right}, true
}

@(private="file")
call_infix_procedure :: proc(parser: ^Parser, left: Expression) -> (Expression, bool) {
    token, ok := peek(parser)
    if !ok {
        return {}, false
    }
    switch token.(Operator) {
        case .Add, .Divide, .Multiply, .Subtract: return parse_infix_expression(parser, left)
        case: panic("unreachable")
    }
}

@(private="file")
parse_expression :: proc(parser: ^Parser, min_precedence: Precedence) -> (Expression, bool) {
    left, ok := call_prefix_procedure(parser)
    if !ok {
        return {}, false
    }
    for {
        token, ok := peek(parser)
        if !ok {
            break
        }
        operator: Operator
        operator, ok = token.(Operator)
        if !ok {
            break
        }
        precedence: Precedence
        precedence, ok = get_precedence(operator)
        if precedence < min_precedence {
            break
        }
        left, ok = call_infix_procedure(parser, left)
        if !ok {
            return {}, false
        }
    }
    return left, true
}

parse :: proc(tokens: [dynamic]Token) -> (Expression, bool) {
    parser := Parser{tokens, 0}
    return parse_expression(&parser, .Lowest)
}
