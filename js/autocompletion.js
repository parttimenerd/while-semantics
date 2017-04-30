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

const WHILE_KEYWORDS = ["not",
    "true", "false", "end", "if", "then", "else", "do",
    "while", "var", "skip"];

const WORD = /\w+/g;

function whileCompletionHints(sourceCode, varsCode){
    const words = (sourceCode + "|" + varsCode).match(WORD);
    if (words) {
        return words.concat(WHILE_KEYWORDS);
    }
    return []
}

function varsCompletionHints(whileCode, varsCode){
    const existingVars = varsCode.match(WORD) || [];
    return whileCompletionHints(whileCode, varsCode)
            .filter((word) => !WHILE_KEYWORDS.includes(word) && !(/^[+-]?\d+$/.test(word)) && !existingVars.includes(word))
        .concat(["->", "→", "↦"])
}