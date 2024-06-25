import readline from 'node:readline';

enum TokenType {
    IntegerLiteral,

    Plus,
    Minus,
    Asterisk,
    Slash,
    Paren_L,
    Paren_R,
}

interface Token {
    token_type: TokenType;
}

interface IntegerLiteral extends Token {
    value: number;
}

function isWhitespace(char: string): boolean {
    return [' ', '\t', '\n', '\r'].includes(char);
}

function isDigit(char: string): boolean {
    const code = char.charCodeAt(0);
    return (code >= '0'.charCodeAt(0)) && (code <= '9'.charCodeAt(0));
}

class Lexer {
    input: string;
    pos: number;

    constructor(input: string) {
        this.input = input;
        this.pos = 0;
    }

    peek(): string | null {
        if (this.pos >= this.input.length) {
            return null;
        }
        return this.input.charAt(this.pos);
    }

    advance() {
        this.pos += 1;
    }

    next(): string | null {
        const char = this.peek();
        this.advance();
        return char;
    }

    skipWhitespace() {
        while (true) {
            const char = this.peek();
            if (char === null) {
                break;
            }
            if (!isWhitespace(char)) {
                break;
            }
            this.advance();
        }
    }

    parseIntegerLiteral(): IntegerLiteral {
        const start = this.pos - 1;
        
        while (true) {
            const char = this.peek();
            if (char === null) {
                break;
            }
            if (!isDigit(char)) {
                break;
            }
            this.advance();
        }

        const end = this.pos;
        const literal = this.input.slice(start, end);

        return {
            token_type: TokenType.IntegerLiteral,
            value: Number(literal),
        };
    }

    tokenize(): Token[] {
        let tokens: Token[] = [];
        while (true) {
            this.skipWhitespace();

            const char = this.next();
            if (char === null) {
                break;
            }

            if (isDigit(char)) {
                tokens.push(this.parseIntegerLiteral());
            }
            else {
                switch(char) {
                    case '+': tokens.push({token_type: TokenType.Plus}); break;
                    case '-': tokens.push({token_type: TokenType.Minus}); break;
                    case '*': tokens.push({token_type: TokenType.Asterisk}); break;
                    case '/': tokens.push({token_type: TokenType.Slash}); break;
                    case '(': tokens.push({token_type: TokenType.Paren_L}); break;
                    case ')': tokens.push({token_type: TokenType.Paren_R}); break;
                    default: throw new Error(`Unexpected token "${char}"!`);
                }
            }
        }
        return tokens;
    }
}

enum Precedence {
    Lowest,
    Addition,
    Multiplication,
    Prefix,
}

function getPrecedence(token_type: TokenType): Precedence | null {
    switch(token_type) {
        case TokenType.Plus:
        case TokenType.Minus:
            return Precedence.Addition;
        case TokenType.Asterisk:
        case TokenType.Slash:
            return Precedence.Multiplication;
        default: return null;
    }
}

class Parser {
    tokens: Token[];
    pos: number;

    constructor(input: Token[]) {
        this.tokens = input;
        this.pos = 0;
    }

    peek(): Token | null {
        if (this.pos >= this.tokens.length) {
            return null;
        }
        return this.tokens[this.pos];
    }

    advance() {
        this.pos += 1;
    }

    next(): Token | null {
        const token = this.peek();
        this.advance();
        return token;
    }

    parsePrefixExpression(): Expression {
        const operator = this.next()!;
        const expression = this.parseExpression(Precedence.Prefix);
        return new UnaryExpression(operator, expression);
    }

    parseIntegerLiteral(): IntegerExpression {
        const integer = this.next()! as IntegerLiteral;
        return new IntegerExpression(integer.value);
    }

    parseGroupedExpression(): Expression {
        this.advance();
        const expression = this.parseExpression(Precedence.Lowest);
        const paren_r = this.next();
        if (paren_r === null) {
            throw new Error("Sudden EOF");
        }
        if (paren_r.token_type !== TokenType.Paren_R) {
            throw new Error("Expected Paren_R");
        }
        return expression;
    }

    callPrefixFunction(): Expression {
        const peek = this.peek();
        if (peek === null) {
            throw new Error("Sudden EOF");
        }
        switch(peek.token_type) {
            case TokenType.Plus:
            case TokenType.Minus:
                return this.parsePrefixExpression();
            case TokenType.IntegerLiteral:
                return this.parseIntegerLiteral();
            case TokenType.Paren_L:
                return this.parseGroupedExpression();
            default: throw new Error("Unexpected token");
        }
    }

    parseInfixExpression(left: Expression, precedence: Precedence): BinaryExpression {
        const operator = this.next()!;
        const right = this.parseExpression(precedence);
        return new BinaryExpression(left, operator, right);
    }

    callInfixFunction(left: Expression, precedence: Precedence) {
        const peek = this.peek()!;
        switch(peek.token_type) {
            case TokenType.Plus:
            case TokenType.Minus:
            case TokenType.Asterisk:
            case TokenType.Slash:
                return this.parseInfixExpression(left, precedence);
            default: throw new Error("Unexpected token");
        }
    }

    parseExpression(min_precedence: Precedence): Expression {
        var left = this.callPrefixFunction();
        while (true) {
            const peek = this.peek();
            if (peek === null) {
                break;
            }
            const precedence = getPrecedence(peek.token_type);
            if (precedence === null) {
                break;
            }
            if (precedence <= min_precedence) {
                break;
            }
            left = this.callInfixFunction(left, precedence);
        }
        return left;
    }

    parse(): Expression {
        return this.parseExpression(Precedence.Lowest);
    }
}

interface Expression {
    eval(): number;
}

class IntegerExpression implements Expression {
    value: number;

    constructor(value: number) {
        this.value = value;
    }

    eval(): number {
        return this.value;
    }
}

class UnaryExpression implements Expression {
    operator: Token;
    expression: Expression;

    constructor(operator: Token, expression: Expression) {
        this.operator = operator;
        this.expression = expression;
    }

    eval(): number {
        const value = this.expression.eval();
        switch(this.operator.token_type) {
            case TokenType.Plus: return value;
            case TokenType.Minus: return -value;
            default: throw new Error("Unknown unary operator");
        }
    }
}

class BinaryExpression implements Expression {
    left: Expression;
    operator: Token;
    right: Expression;

    constructor(left: Expression, operator: Token, right: Expression) {
        this.left = left;
        this.operator = operator;
        this.right = right;
    }

    eval(): number {
        const lvalue = this.left.eval();
        const rvalue = this.right.eval();
        switch(this.operator.token_type) {
            case TokenType.Plus: return lvalue + rvalue;
            case TokenType.Minus: return lvalue - rvalue;
            case TokenType.Asterisk: return lvalue * rvalue;
            case TokenType.Slash: return Math.floor(lvalue / rvalue);
            default: throw new Error("Unknown binary operator");
        }
    }
}

const input = "1 * 2 + 3 * 4";
let lexer = new Lexer(input);
let tokens = lexer.tokenize();
let parser = new Parser(tokens);
let expression = parser.parse();
let result = expression.eval();
console.log(result);


