from abc import ABC, abstractmethod
from typing import Self
from enum import Enum


class Precedence(Enum):
    LOWEST = 0
    ADDITION = 1
    MULTIPLICATION = 2
    PREFIX = 3


class Parser:
    source: str
    pos: int = 0

    def __init__(self: Self, source: str) -> Self:
        self.source = source

    def advance(self: Self):
        self.pos += 1

    def peek(self: Self) -> str:
        if self.pos < len(self.source):
            return self.source[self.pos]
        return None

    def next(self: Self) -> str:
        token = self.peek()
        self.advance()
        return token

    def get_precedence(token):
        match token:
            case '+' | '-': return Precedence.ADDITION
            case '*' | '/': return Precedence.MULTIPLICATION
            case _: return None

    def parse_integer_literal(self: Self) -> 'Expression':
        return IntegerLiteral(int(self.next()))

    def parse_prefix_expression(self: Self) -> 'Expression':
        operator = self.next()
        expression = self.parse_expression(Precedence.PREFIX)
        return UnaryExpression(operator, expression)

    def parse_grouped_expression(self: Self) -> 'Expression':
        self.advance()
        expression = self.parse_expression(Precedence.LOWEST)
        paren_r = self.next()
        if paren_r != ')':
            raise Exception(f"Unexpected token '{paren_r}'")
        return expression

    def call_prefix_function(self: Self) -> 'Expression':
        token = self.peek()
        if token is None:
            raise Exception('Sudden EOF')
        match token:
            case '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | \
                    '9' | '0': return self.parse_integer_literal()
            case '+' | '-': return self.parse_prefix_expression()
            case '(': return self.parse_grouped_expression()
            case _: raise Exception(f"Unexpected token '{token}'")

    def parse_infix_expression(
            self: Self,
            left: 'Expression',
            precedence: Precedence) -> 'Expression':
        operator = self.next()
        right = self.parse_expression(precedence)
        return BinaryExpression(left, operator, right)

    def call_infix_function(
            self: Self,
            left: 'Expression',
            precedence: Precedence) -> 'Expression':
        token = self.peek()
        match token:
            case '+' | '-' | '*' | '/':
                return self.parse_infix_expression(left, precedence)
            case _: raise Exception(f"Unexpected token '{token}'")

    def parse_expression(self: Self, precedence: Precedence) -> 'Expression':
        left = self.call_prefix_function()

        while True:
            peek = self.peek()
            if peek is None:
                break
            precedence = Parser.get_precedence(peek)
            if precedence is None:
                break
            left = self.call_infix_function(left, precedence)

        return left

    def parse(self: Self) -> 'Expression':
        return self.parse_expression(Precedence.LOWEST)


class Expression(ABC):
    @abstractmethod
    def eval(self: Self) -> int:
        pass


class BinaryExpression(Expression):
    left: Expression
    operator: str
    right: Expression

    def __init__(
            self: Self,
            left: Expression,
            operator: str,
            right: Expression) -> Self:
        self.left = left
        self.operator = operator
        self.right = right

    def eval(self: Self) -> int:
        left = self.left.eval()
        right = self.right.eval()
        match self.operator:
            case '+': return left + right
            case '-': return left - right
            case '*': return left * right
            case '/': return left // right
            case _: raise Exception('Unknown operator')


class UnaryExpression(Expression):
    operator: str
    expression: Expression

    def __init__(self: Self, operator: str, expression: Expression) -> Self:
        self.operator = operator
        self.expression = expression

    def eval(self: Self) -> int:
        value = self.expression.eval()
        match self.operator:
            case '+': return value
            case '-': return -value
            case _: raise Exception('Unknown operator')


class IntegerLiteral(Expression):
    value: int

    def __init__(self: Self, value: int) -> Self:
        self.value = value

    def eval(self: Self) -> int:
        return self.value


result = Parser("1*(2+3)*4").parse().eval()
print(result)
