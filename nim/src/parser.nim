import std/options

import tokenizer
import expression

type
    TokenStream = object
        tokens: seq[Token]
        pos: int = 0
    Precedence = enum
        lowest,
        addition,
        multiplication,
        prefix

proc get_precedence(token: Token): Option[Precedence] =
    if token.kind != tkOperator:
        return none(Precedence)
    case token.operator
        of Operator.add: return some(addition)
        else: return none(Precedence)

proc advance(stream: var TokenStream) =
    stream.pos += 1

proc peek(stream: TokenStream): Option[Token] =
    if stream.pos < len(stream.tokens):
        return some(stream.tokens[stream.pos])
    return none(Token)

proc next(stream: var TokenStream): Option[Token] =
    let token = stream.peek()
    stream.advance()
    return token

proc call_prefix_procedure(stream: var TokenStream): Expression =
    discard

proc call_infix_procedure(stream: var TokenStream, left: Expression): Expression =
    discard

proc parse_expression(stream: var TokenStream, min_precedence: Precedence): Expression =
    var left = stream.call_prefix_procedure()

    while true:
        let token = stream.peek()
        if token.isNone():
            break
        let precedence = get_precedence(token.get())
        if precedence.isNone():
            break
        if precedence.get() < min_precedence:
            break
        left = stream.call_infix_procedure(left)

    return left

proc parse*(tokens: seq[Token]): Expression =
    var stream = TokenStream(tokens: tokens)
    return stream.parse_expression(lowest)
