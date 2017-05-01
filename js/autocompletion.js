const WHILE_KEYWORDS = ["not",
    "true", "false", "end", "if", "then", "else", "do",
    "while", "var", "skip"];

const WHILE_PATTERNS = [
    {displayText: "while (<caret>) do "},
    {displayText: "while (true) do <caret>"},
    {displayText: "while (<caret>) do skip"},
    {displayText: "if (<caret>) then else "},
    {displayText: "if (<caret>) then else skip"},
    {displayText: "if (<caret>) then skip else "},
].concat(["var", "do", "else", "then", ":="].map((x) => ({
    text: x + " ",
    displayText: x,
    advance: x.length + 1
})))
    .map((p) => ({
    text: p.text || p.displayText.replace("<caret>", ""),
    displayText: p.displayText || p.text,
    advance: p.advance || p.displayText.indexOf("<caret>"),
    hint: (cm, data, completion) => {
        cm.replaceRange(completion.text, completion.from || data.from,
            completion.to || data.to, "complete");
        cm.setCursor(cm.getCursor().line, cm.getCursor("from").ch - (completion.text.length - completion.advance))
    }
}));

const WORD = /\w+/g;

function getCurrentWord(cm){
    let cur = cm.getCursor(), curLine = cm.getLine(cur.line);
    let end = cur.ch, start = end;
    while (start && /\w+/.test(curLine.charAt(start - 1))) --start;
    return curWord = start !== end && curLine.slice(start, end);
}

CodeMirror.commands.autocomplete = function(cm, completeSingle = true) {
    const curWord = getCurrentWord(cm);
    const words = Array.from(new Set(cm.options.wordHints(cm.getValue())))
        .filter((w) => w !== curWord).filter((w) => w.startsWith(curWord));
    if (words.length > 0 && curWord && curWord.length > 0) {
        cm.showHint({hint: (cm, _) => CodeMirror.hint.fromList(cm, {words: words}), completeSingle: completeSingle});
    }
};

CodeMirror.commands.autocompleteWhile = function(cm, completeSingle = true) {
    // based on the fromList helper of CodeMirrors show-hints addon
    const curWord = getCurrentWord(cm);
    const cur = cm.getCursor(), token = cm.getTokenAt(cur);
    const to = CodeMirror.Pos(cur.line, token.end);
    if (token.string && /\w/.test(token.string[token.string.length - 1])) {
        var term = token.string, from = CodeMirror.Pos(cur.line, token.start);
    } else {
        var term = "", from = to;
    }
    // identifiers and numbers from the code without the keywords for loops and conditions
    const words = Array.from(new Set(cm.options.wordHints(cm.getValue())))
        .filter((w) => w !== curWord)
        .filter((w) => w.startsWith(curWord) && !["if", "while"].includes(w) && !["var", "do", "else", "then", ":="].includes(w))
        .sort();
    const wordPatterns = words.map((w) => ({"text": w}));
    const patterns = wordPatterns.concat(WHILE_PATTERNS.filter((p) => p.text.startsWith(curWord)));
    if (patterns.length > 0 && curWord && curWord.length > 0) {
        cm.showHint({hint: (cm, _) => ({list: patterns, from: from, to: to}), completeSingle: completeSingle});
    }
};

function whileCompletionHints(sourceCode, varsCode){
    const words = (sourceCode + "|" + varsCode).match(WORD);
    if (words) {
        return words.concat(WHILE_KEYWORDS);
    }
    return []
}

function decrementCursor(cm, cursor){
    if (cursor.ch > 0){
        return {line: cursor.line, ch: cursor.ch - 1};
    } else if (cursor.line > 0) {
        return {line: cursor.line - 1, ch: cm.getLine(cursor.line - 1).length}
    }
    return null
}

function getPreviousNonCommentToken(cm){
    let cur = cm.getCursor();
    const currentToken = cm.getTokenAt(cur);
    while (currentToken.string === cm.getTokenAt(cur).string){
        cur = decrementCursor(cm, cur);
    }
    while (cur){
        const token = cm.getTokenAt(cur);
        if (token.type !== null && token.type !== "comment"){
            return token;
        }
        cur = decrementCursor(cm, cur);
    }
    return null;
}

CodeMirror.commands.autocompleteVars = function(cm, completeSingle = true) {
    // based on the fromList helper of CodeMirrors show-hints addon
    const curWord = getCurrentWord(cm) || "";
    const cur = cm.getCursor(), token = cm.getTokenAt(cur);
    const to = CodeMirror.Pos(cur.line, token.end);
    if (token.string && /\w/.test(token.string[token.string.length - 1])) {
        var term = token.string, from = CodeMirror.Pos(cur.line, token.start);
    } else {
        var term = "", from = to;
    }

    const existingVars = cm.getValue().match(WORD) || [];
    const strs = whileCompletionHints(cm.options.sourceCode(), cm.getValue())
        .filter((word) => !WHILE_KEYWORDS.includes(word) && !existingVars.includes(word));
    const numbers = strs.filter((w) => /^[+-]?\d+$/.test(w));
    const variables = strs.filter((w) => /^\w+$/.test(w) && !numbers.includes(w));

    const prevToken = getPreviousNonCommentToken(cm);

    let completeMode =  "variable";
    if (token.string === "-") {
        completeMode = "arrow";
    } else if (token.string === ","){
        completeMode = "variable";
    } else if (token.type !== null){
        completeMode = token.type;
    } else {
        switch (prevToken.type) {
            case "variable":
                completeMode = "arrow";
                break;
            case "arrow":
                completeMode = "number";
                break;
            case "number":
                completeMode = "comma";
                break;
        }
    }

    let hints = [];

    switch(completeMode){
        case "variable":
            hints = variables.filter((v) => v.startsWith(curWord)).map((v) => v + " ↦ ");
            break;
        case "arrow":
            hints = [{
                "text": "↦ ",
                "hint": (cm, data, completion) => {
                    let from = completion.from || data.from;
                    const curToken = cm.getTokenAt(from);
                    if (curToken.string.startsWith("-")){
                        from = decrementCursor(cm, from);
                        if (curToken.string === "->"){
                            from = decrementCursor(cm, from);
                        }
                    }
                    cm.replaceRange(completion.text, from,
                        completion.to || data.to, "complete");
                    cm.setCursor(cm.getCursor().line, cm.getCursor("from").ch);
                }
            }];
            break;
        case "number":
            hints = numbers.filter((x) => x.startsWith(curWord));
            if (curWord.length > 0){
                hints.push(curWord);
                hints.push(curWord + ", ");
            }
            break;
        case "comma":
            hints = [", "];
            break;
    }

    // identifiers and numbers from the code without the keywords for loops and conditions
    const completions = hints.length > 1 ? Array.from(new Set(hints)).sort() : hints;
    if (completions.length > 0) {
        cm.showHint({hint: (cm, _) => ({list: completions, from: from, to: to}), completeSingle: completeSingle});
    }
};

function varsCompletionHints(whileCode, varsCode){
    const existingVars = varsCode.match(WORD) || [];
    return whileCompletionHints(whileCode, varsCode)
            .filter((word) => !WHILE_KEYWORDS.includes(word) && !(/^[+-]?\d+$/.test(word)) && !existingVars.includes(word))
        .concat(["->", "→", "↦"])
}