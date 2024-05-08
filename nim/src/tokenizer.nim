from std/strutils import parseInt

type
    Operator* = enum
        add, subtract, multiply, divide
    Special* = enum
        paren_l, paren_r
    TokenKind* = enum
        tkOperator,
        tkSpecial,
        tkInt,
    Token* = ref object
        case kind*: TokenKind
        of tkOperator: operator*: Operator
        of tkSpecial: special*: Special
        of tkInt: value*: int
    TokenizerError* = object of ValueError
        
proc is_digit(c: char): bool =
    return c >= '0' and c <= '9'

proc is_whitespace(c: char): bool =
    case c
    of ' ', '\t', '\r', 'f':
        return true
    else:
        return false

proc get_operator(c: char): (bool, Operator) =
    case c
    of '+': return (true, add)
    of '-': return (true, subtract)
    of '*': return (true, multiply)
    of '/': return (true, divide)
    else: return (false, add)

proc get_special(c: char): (bool, Special) =
    case c
    of '(': return (true, paren_l)
    of ')': return (true, paren_r)
    else: return (false, paren_l)

proc tokenize*(source: string): seq[Token] =
    var
        tokens: seq[Token] = @[]
        reading_integer = false
        buffer = ""

    for c in source:
        if reading_integer:
            if is_digit(c):
                buffer.add(c)
                continue
            else:
                let integer = parseInt(buffer)
                tokens.add(Token(kind: tkInt, value: integer))
                buffer = ""
                reading_integer = false

        let (is_operator, operator) = get_operator(c)
        let (is_special, special) = get_special(c)
        if is_digit(c):
            buffer.add(c)
            reading_integer = true
        elif is_operator:
            tokens.add(Token(kind: tkOperator, operator: operator))
        elif is_special:
            tokens.add(Token(kind: tkSpecial, special: special))
        elif is_whitespace(c):
            discard
        else:
            raise newException(TokenizerError, "Unknown character!")

    if reading_integer:
        let integer = parseInt(buffer)
        tokens.add(Token(kind: tkInt, value: integer))

    return tokens
