from tokenizer import Operator

type
    UnaryExpression* = object
        operator*: Operator
        expression*: Expression
    BinaryExpression* = object
        left*: Expression
        operator*: Operator
        right*: Expression
    ExpressionKind* = enum
        ekInt
        ekUnary
        ekBinary
    Expression* = ref object
        case kind*: ExpressionKind
        of ekInt: intValue*: int
        of ekUnary: unary*: UnaryExpression
        of ekBinary: binary*: BinaryExpression
        
proc eval(unary: UnaryExpression): int
proc eval(binary: BinaryExpression): int
proc eval*(expression: Expression): int

proc eval(unary: UnaryExpression): int =
    let value = unary.expression.eval()

    case unary.operator
    of add: return value
    of subtract: return -value
    else: raise newException(ValueError, "Invalid unary operator")

proc eval(binary: BinaryExpression): int =
    let lvalue = binary.left.eval()
    let rvalue = binary.right.eval()

    case binary.operator
    of add: return lvalue + rvalue
    of subtract: return lvalue - rvalue
    of multiply: return lvalue * rvalue
    of divide: return int(lvalue / rvalue)
    # else: raise newException(ValueError, "Invalid binary operator")

proc eval*(expression: Expression): int =
    case expression.kind
    of ekInt: return expression.intValue
    of ekUnary: return expression.unary.eval()
    of ekBinary: return expression.binary.eval()

