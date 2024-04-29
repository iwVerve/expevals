package main

Expression :: union #no_nil {
    IntegerLiteral,
    UnaryExpression,
    BinaryExpression,
}

BinaryExpression :: struct {
    lvalue: ^Expression,
    operator: Operator,
    rvalue: ^Expression,
}

UnaryExpression :: struct {
    operator: Operator,
    value: ^Expression,
}

eval :: proc(expression: Expression) -> int {
    switch e in expression {
        case IntegerLiteral: return e
        case UnaryExpression: return eval_unary_expression(e)
        case BinaryExpression: return eval_binary_expression(e)
        case: panic("Unreachable")
    }
}

free_expression :: proc(expression: Expression) {
    #partial switch e in expression {
        case UnaryExpression:
            free_expression(e.value^)
            free(e.value)
        case BinaryExpression:
            free_expression(e.lvalue^)
            free_expression(e.rvalue^)
            free(e.lvalue)
            free(e.rvalue)
    }
}

@(private="file")
eval_unary_expression :: proc(expression: UnaryExpression) -> int {
    value := eval(expression.value^)
    #partial switch expression.operator {
        case .Add: return value
        case .Subtract: return -value
        case: panic("eval_unary_expression with invalid operator.")
    }
}

@(private="file")
eval_binary_expression :: proc(expression: BinaryExpression) -> int {
    lvalue := eval(expression.lvalue^)
    rvalue := eval(expression.rvalue^)
    switch expression.operator {
        case .Add: return lvalue + rvalue
        case .Subtract: return lvalue - rvalue
        case .Multiply: return lvalue * rvalue
        case .Divide: return lvalue / rvalue
        case: panic("Unreachable")
    }
}
