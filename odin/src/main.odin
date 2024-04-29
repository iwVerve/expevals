package main

import "core:fmt"
import "core:os"

main :: proc() {
    buf: [256]byte
    for {
        fmt.print("> ")
        n, err := os.read(os.stdin, buf[:])
        if err < 0 {
            return
        }

        source := string(buf[:n])
        if len(source) == 0 {
            return
        }

        tokens := tokenize(source)
        expression, ok := parse(tokens)
        if !ok {
            return
        }
        result := eval(expression)
        fmt.println(result)

        free_expression(expression)
    }
}
