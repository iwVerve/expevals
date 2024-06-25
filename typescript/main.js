var TokenType;
(function (TokenType) {
    TokenType[TokenType["IntegerLiteral"] = 0] = "IntegerLiteral";
    TokenType[TokenType["Plus"] = 1] = "Plus";
    TokenType[TokenType["Minus"] = 2] = "Minus";
    TokenType[TokenType["Asterisk"] = 3] = "Asterisk";
    TokenType[TokenType["Slash"] = 4] = "Slash";
    TokenType[TokenType["Paren_L"] = 5] = "Paren_L";
    TokenType[TokenType["Paren_R"] = 6] = "Paren_R";
})(TokenType || (TokenType = {}));
function isWhitespace(char) {
    return [' ', '\t', '\n', '\r'].includes(char);
}
function isDigit(char) {
    const code = char.charCodeAt(0);
    return (code >= '0'.charCodeAt(0)) && (code <= '9'.charCodeAt(0));
}
class Lexer {
    constructor(input) {
        this.input = input;
        this.pos = 0;
    }
    peek() {
        if (this.pos >= this.input.length) {
            return null;
        }
        return this.input.charAt(this.pos);
    }
    advance() {
        this.pos += 1;
    }
    next() {
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
    parseIntegerLiteral() {
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
    tokenize() {
        let tokens = [];
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
                switch (char) {
                    case '+':
                        tokens.push({ token_type: TokenType.Plus });
                        break;
                    case '-':
                        tokens.push({ token_type: TokenType.Minus });
                        break;
                    case '*':
                        tokens.push({ token_type: TokenType.Asterisk });
                        break;
                    case '/':
                        tokens.push({ token_type: TokenType.Slash });
                        break;
                    case '(':
                        tokens.push({ token_type: TokenType.Paren_L });
                        break;
                    case ')':
                        tokens.push({ token_type: TokenType.Paren_R });
                        break;
                    default: throw new Error(`Unexpected token "${char}"!`);
                }
            }
        }
        return tokens;
    }
}
var Precedence;
(function (Precedence) {
    Precedence[Precedence["Lowest"] = 0] = "Lowest";
    Precedence[Precedence["Addition"] = 1] = "Addition";
    Precedence[Precedence["Multiplication"] = 2] = "Multiplication";
    Precedence[Precedence["Prefix"] = 3] = "Prefix";
})(Precedence || (Precedence = {}));
function getPrecedence(token_type) {
    switch (token_type) {
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
    constructor(input) {
        this.tokens = input;
        this.pos = 0;
    }
    peek() {
        if (this.pos >= this.tokens.length) {
            return null;
        }
        return this.tokens[this.pos];
    }
    advance() {
        this.pos += 1;
    }
    next() {
        const token = this.peek();
        this.advance();
        return token;
    }
    parsePrefixExpression() {
        const operator = this.next();
        const expression = this.parseExpression(Precedence.Prefix);
        return new UnaryExpression(operator, expression);
    }
    parseIntegerLiteral() {
        const integer = this.next();
        return new IntegerExpression(integer.value);
    }
    parseGroupedExpression() {
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
    callPrefixFunction() {
        const peek = this.peek();
        if (peek === null) {
            throw new Error("Sudden EOF");
        }
        switch (peek.token_type) {
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
    parseInfixExpression(left, precedence) {
        const operator = this.next();
        const right = this.parseExpression(precedence);
        return new BinaryExpression(left, operator, right);
    }
    callInfixFunction(left, precedence) {
        const peek = this.peek();
        switch (peek.token_type) {
            case TokenType.Plus:
            case TokenType.Minus:
            case TokenType.Asterisk:
            case TokenType.Slash:
                return this.parseInfixExpression(left, precedence);
            default: throw new Error("Unexpected token");
        }
    }
    parseExpression(min_precedence) {
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
    parse() {
        return this.parseExpression(Precedence.Lowest);
    }
}
class IntegerExpression {
    constructor(value) {
        this.value = value;
    }
    eval() {
        return this.value;
    }
}
class UnaryExpression {
    constructor(operator, expression) {
        this.operator = operator;
        this.expression = expression;
    }
    eval() {
        const value = this.expression.eval();
        switch (this.operator.token_type) {
            case TokenType.Plus: return value;
            case TokenType.Minus: return -value;
            default: throw new Error("Unknown unary operator");
        }
    }
}
class BinaryExpression {
    constructor(left, operator, right) {
        this.left = left;
        this.operator = operator;
        this.right = right;
    }
    eval() {
        const lvalue = this.left.eval();
        const rvalue = this.right.eval();
        switch (this.operator.token_type) {
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
export {};
