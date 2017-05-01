// based on the lua mode

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

// LUA mode. Ported to CodeMirror 2 from Franciszek Wawrzak's
// CodeMirror 1 mode.
// highlights keywords, strings, comments (no leveling supported! ("[==[")), tokens, basic indenting

(function(mod) {
    if (typeof exports == "object" && typeof module == "object") // CommonJS
        mod(require("../../lib/codemirror"));
    else if (typeof define == "function" && define.amd) // AMD
        define(["../../lib/codemirror"], mod);
    else // Plain browser env
        mod(CodeMirror);
})(function(CodeMirror) {
    "use strict";

    CodeMirror.defineMode("while", function(config, parserConfig) {
        var indentUnit = config.indentUnit;

        function prefixRE(words) {
            return new RegExp("^(?:" + words.join("|") + ")", "i");
        }
        function wordRE(words) {
            return new RegExp("^(?:" + words.join("|") + ")$", "i");
        }
        var specials = wordRE(parserConfig.specials || []);

        // long list of standard functions from lua manual
        var builtins = wordRE([
            "skip"
        ]);
        var keywords = wordRE(["not",
            "true", "false", "end", "if", "then", "else", "do",
            "while", "var", ":=", "->", "→", "↦"]);

        var indentTokens = wordRE(["if","do", "\\(", "{"]);
        var dedentTokens = wordRE(["end", "\\)", "}"]);
        var dedentPartial = prefixRE(["end", "\\)", "}", "else"]);

        function normal(stream, state) {
            var ch = stream.next();
            if (ch === "/") {
                if (stream.eat("*")) {
                    var maybeEnd = false, ch;
                    while (ch = stream.next()) {
                        if (ch == "/" && maybeEnd) {
                            break;
                        }
                        maybeEnd = (ch == "*");
                    }
                    return "comment"
                } else if (stream.eat("/")) {
                    stream.skipToEnd();
                    return "comment";
                }
            }
            if (/\d|⊥/.test(ch)) {
                stream.eatWhile(/[\w.%]|⊥/);
                return "number";
            }
            if ((ch === "-" && stream.next() === ">") || ch === "→" || ch === "↦"){
                return "arrow";
            }
            if (ch === ","){
                return "comma";
            }
            if (ch == ":"){
                if (stream.next() == "="){
                    return "assign"
                }
                return null;
            }
            if (/[\w_]/.test(ch)) {
                stream.eatWhile(/[\w\\\-_.]/);
                return "variable";
            }
            return null;
        }

        function bracketed(level, style) {
            return function(stream, state) {
                var curlev = null, ch;
                while ((ch = stream.next()) != null) {
                    if (curlev == null) {if (ch == "]") curlev = 0;}
                    else if (ch == "=") ++curlev;
                    else if (ch == "]" && curlev == level) { state.cur = normal; break; }
                    else curlev = null;
                }
                return style;
            };
        }

        function string(quote) {
            return function(stream, state) {
                var escaped = false, ch;
                while ((ch = stream.next()) != null) {
                    if (ch == quote && !escaped) break;
                    escaped = !escaped && ch == "\\";
                }
                if (!escaped) state.cur = normal;
                return "string";
            };
        }

        return {
            startState: function(basecol) {
                return {basecol: basecol || 0, indentDepth: 0, cur: normal};
            },

            token: function(stream, state) {
                if (stream.eatSpace()) return null;
                var style = state.cur(stream, state);
                var word = stream.current();
                if (style == "variable") {
                    if (keywords.test(word)) style = "keyword";
                    else if (builtins.test(word)) style = "builtin";
                    else if (specials.test(word)) style = "variable-2";
                }
                if ((style != "comment") && (style != "string")){
                    if (indentTokens.test(word)) ++state.indentDepth;
                    else if (dedentTokens.test(word)) --state.indentDepth;
                }
                return style;
            },

            indent: function(state, textAfter) {
                var closing = dedentPartial.test(textAfter);
                return state.basecol + indentUnit * (state.indentDepth - (closing ? 1 : 0));
            },

            lineComment: "//",
            blockCommentStart: "/*",
            blockCommentEnd: "*/"
        };
    });

    CodeMirror.defineMIME("text/x-while", "while");


    var WORD = /[\w$]+/g, RANGE = 500;

    CodeMirror.registerHelper("hint", "anyword", function(editor, options) {
        var word = options && options.word || WORD;
        var range = options && options.range || RANGE;
        var cur = editor.getCursor(), curLine = editor.getLine(cur.line);
        var start = cur.ch, end = start;
        while (end < curLine.length && word.test(curLine.charAt(end))) ++end;
        while (start && word.test(curLine.charAt(start - 1))) --start;
        var curWord = start != end && curLine.slice(start, end);

        var list = [], seen = {};
        function scan(dir) {
            var line = cur.line, end = Math.min(Math.max(line + dir * range, editor.firstLine()), editor.lastLine()) + dir;
            for (; line != end; line += dir) {
                var text = editor.getLine(line), m;
                word.lastIndex = 0;
                while (m = word.exec(text)) {
                    if ((!curWord || m[0].indexOf(curWord) == 0) && !seen.hasOwnProperty(m[0])) {
                        seen[m[0]] = true;
                        list.push(m[0]);
                    }
                }
            }
        }
        scan(-1);
        scan(1);
        return {list: list, from: CodeMirror.Pos(cur.line, start), to: CodeMirror.Pos(cur.line, end)};
    });
});