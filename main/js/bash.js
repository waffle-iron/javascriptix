(function (j$) {
    'use strict';
    
    function contains(text, char) {
        return text.indexOf(char) > -1 ? char : null;
    }
    
    function isWhitespace(character) {
        return contains(" \t", character);
    }
    function isMeta(character) {
        return contains("\n|&;<>()", character);
    }
    
    function isQuote(character) {
        return contains("\"'", character);
    }
    
    function isEscape(character) {
        return contains("\\", character);
    }
    
    function Filters() {
        this.filters = [];
        this.addFilter = function (match, action) {
            this.filters.push({match: match, action: action});
        };
        this.doFilter = function (char) {
            var i = 0, match = false;
            while (i < this.filters.length) {
                match = this.filters[i].match(char);
                if (match) {
                    this.filters[i].action(char);
                }
                i++;
            }
        };
    }

    function IncompleteInputError() {
        this.base = Error;
    }
        
    function tokenize() {
        var index = 0, start = 0, tokens = [], text = "";
        
        function init(input) {
            if (!text) {
                index = 0;
                start = 0;
                tokens = [];
            }
            text += input;
        }
        
        function add(i) {
            if (i > start) {
                tokens.push(text.substring(start, i));
                start = i;
            }
        }
        
        function findPair(char) {
            var i = start;
            do {
                i = text.indexOf(char, i + 1);
            } while (i > -1 && isEscape(text[i - 1]));
            if (i > -1) {
                add(i + 1);
                index = i;
            } else {
                throw new j$.bash.IncompleteInputError();
            }
        }
        
        return function (input) {
            var filters = new Filters();
            filters.addFilter(isWhitespace, function () { add(index); start++; });
            filters.addFilter(isMeta, function () { add(index); add(index + 1); });
            filters.addFilter(isQuote, function (char) { add(index); findPair(char); });
            init(input);
            
            while (index < text.length) {
                filters.doFilter(text[index]);
                index++;
            }
            add(index);
            text = "";
            return tokens;
        };
    }


    function stripQuotes(args) {
        args.forEach(function (crt, i, array) {
            if (crt && isQuote(crt[0])) {
                array[i] = crt.substr(1, crt.length - 2);
            }
        });
    }

    function isPath(command) {
        return command.indexOf('/') > -1;
    }

    function isBuiltin(command) {
        return j$.bash.builtins.hasOwnProperty(command);
    }

    function execute(executable, command, args) {
        if (executable) {
            return executable.execute(args);
        } else {
            throw new Error(command + ': command not found');
        }
    }

    function getFromPATH(filename) {
        var i = 0, file, dirs = j$.context.env.PATH.split(':');
        while (i < dirs.length && !file) {
            file = j$.fs.get(dirs[i] + '/' + filename, true);
            i++;
        }
        return file;
    }

    function runCommand(command, args) {
        if (isPath(command)) {
            return execute(j$.fs.get(command), command, args);
        } else if (isBuiltin(command)) {
            return j$.bash.builtins[command](args);
        } else {
            return execute(getFromPATH(command), command, args);
        }
    }

    function interpret(userInput) {
        var tokens = j$.bash.tokenize(userInput);
        stripQuotes(tokens);

        if (userInput.length > 0) {
            return runCommand(tokens[0], tokens);
        }
    }

    j$.init = j$.init || {};
    j$.init.bash = function () {
        j$.init.env();
        j$.init.bin();
        j$.init.builtins();

        j$.bash.tokenize = tokenize();

        j$.bash.IncompleteInputError = IncompleteInputError;

        j$.bash.interpret = interpret;
    };

}(window.j$ = window.j$ || {}));