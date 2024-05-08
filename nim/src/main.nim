from tokenizer import tokenize
from parser import parse

let source = "1 * 2 + 3 * 4"
let tokens = tokenize(source)
let expression = parse(tokens)
echo repr(expression)
