/* Source: http://stackoverflow.com/a/36644558 */
Object.entries = typeof Object.entries === 'function' ? Object.entries : obj => Object.keys(obj).map(k => [k, obj[k]]);

/** Abstract AST visitor */
class Visitor {

    defaultVisit(obj){
        return null
    }

    /** @param {Bool} bool */
    visitBool(bool){
        return this.defaultVisit(bool)
    }

    /** @param {Num} number */
    visitNum(number){
        return this.defaultVisit(number)
    }

    /**
     *
     * @param {Var} _var
     */
    visitVar(_var){
        return this.defaultVisit(_var)
    }

    /**
     *
     * @param {Sub} sub
     */
    visitSub(sub){
       return this.defaultVisit(sub)
    }

    /**
     *
     * @param {Mul} mul
     */
    visitMul(mul){
        return this.defaultVisit(mul)
    }

    /**
     *
     * @param {LowerEquals} _le
     */
    visitLowerEquals(_le){
        return this.defaultVisit(_le)
    }

    /**
     *
     * @param {Not} not
     */
    visitNot(not){
        return this.defaultVisit(not)
    }

    /**
     *
     * @param {And} and
     */
    visitAnd(and){
        return this.defaultVisit(and)
    }

    /**
     *
     * @param {Skip} skip
     */
    visitSkip(skip){
        return this.defaultVisit(skip)
    }

    /**
     *
     * @param {Ass} ass
     */
    visitAss(ass){
        return this.defaultVisit(ass)
    }

    /**
     *
     * @param {LocalAss} ass
     */
    visitLocalAss(ass){
        return this.defaultVisit(ass)
    }

    /**
     *
     * @param seq
     */
    visitSeq(seq){
        return this.defaultVisit(seq)
    }

    /**
     *
     * @param {If} _if
     */
    visitIf(_if){
        return this.defaultVisit(_if)
    }

    /**
     *
     * @param {While} _while
     */
    visitWhile(_while){
       return this.defaultVisit(_while)
    }
}

function prettyPrint(obj) {
    return obj.toHTML();
}

function arithmeticValue(aexp, context) {
    if (!(aexp instanceof Aexp)){
        throw "not an Aexp"
    }
    return aexp.eval(context);
}

/**
 *
 * @param {Bexp} bexp
 * @param {Context} context
 * @return {Bool}
 */
function booleanValue(bexp, context) {
    if (!(bexp instanceof Bexp)){
        throw "not an Bexp"
    }
    return bexp.eval(context);
}

class ASTNode {
    /** @return {String} */
    toHTML(){
        console.error("not implemented");
        return "<nothing>"
    }

    /** @param {Visitor} visitor */
    visit(visitor){
        throw "undefined"
    }
}

class Expression extends ASTNode {

}

class Aexp extends Expression {

    /**
     * @param {Context} context
     * @return {Num}
     */
    eval(context){

    }
}

class Num extends Aexp {
    constructor(value){
        super();
        this.value = value;
    }

    toHTML(){
        return this.value;
    }

    visit(visitor){
        return visitor.visitNum(this)
    }

    eval(context){
        return this
    }
}

class ContextFactory {
    constructor(){
        this.maxId = 0
    }

    create(_map){
        let id = this.maxId;
        this.maxId++;
        return new Context(_map, id, this);
    }

    createFromString(str){
        let map = new Map();
        try {
            str.replace(" ", "").split(",").forEach(part => {
                if (part.length > 1) {
                    let subParts = part.split(/->|→/);
                    map.set(subParts[0].trim(), Number(subParts[1].trim()));
                }
            });
        } catch (e){
            console.error(e);
            throw "Context string has invalid format";
        }
        return this.create(map)
    }
}

class Context {

    constructor(_map, id, factory){
        if (!(_map instanceof Map)){
            _map = new Map(Object.entries(_map))
        }
        this.map = new Map();
        for (let key of _map.keys()) {
            if (_map.get(key) instanceof Num) {
                this.map.set(key instanceof Var ? key.name : key, _map.get(key))
            } else {
                this.setValue(key, new Num(_map.get(key)))
            }
        }
        this.id = id;
        this.factory = factory;
    }

    /**
     *
     * @param {Var} _var
     * @return {Number}
     */
    getValue(_var){
        return this.map.get(_var instanceof Var ? _var.name : _var)
    }

    /**
     *
     * @param {Var|String} _var
     * @param value
     */
    setValue(_var, value){
        let varName = _var instanceof Var ? _var.name : _var;
        if (value === undefined){
            this.map.delete(varName);
        } else if (value instanceof Num) {
            this.map.set(varName, value)
        } else {
            this.setValue(_var, new Num(value))
        }
    }

    toHTML(){
        var strs = [];
        for (let key of this.map.keys()) {
            strs.push(`${key} → ${this.map.get(key).toHTML()}`)
        }
        return `[${this.id}, ${strs.join(", ")}]`
    }

    toTooltippedHTML(){
        return `<a tabindex="0" data-container="body" title="${this.toValueHTML()}">${this.toShortHTMLString()}</a>`
    }

    toValueHTML(){
        let strs = [];
        for (let key of this.map.keys()) {
            strs.push(`${key} → ${this.map.get(key).toHTML()}`)
        }
        return strs.length === 0 ? "&empty;" : strs.join(", ")
    }

    toShortString(){
        return `σ${this.id}`
    }

    toShortHTMLString(){
        return `<var>σ<sub>${this.id}</sub></var>`
    }

    /**
     * Creates a copy and sets its var to the given value, returns it
     * @param _var
     * @param value
     * @param {ContextFactory} contextFactory
     * @return {Context}
     */
    setImm(_var, value, contextFactory=null) {
        let con = (contextFactory === null ? this.factory : contextFactory).create(new Map(this.map));
        con.setValue(_var, value);
        return con
    }

}

class Var extends Aexp {
    /**
     *
     * @param {String} name
     */
    constructor(name){
        super();
        this.name = name;
    }

    toHTML(){
        return this.name
    }
    visit(visitor){
        return visitor.visitVar(this);
    }

    eval(context){
        return context.getValue(this)
    }
}

class BinaryAexp extends Aexp {
    /**
     *
     * @param {Aexp} left
     * @param {Aexp} right
     */
    constructor(left, right){
        super();
        this.left = left;
        this.right = right;
    }

    /**
     * @return {String}
     */
    get operator(){
        return null
    }

    toHTML(){
        return `${this.left.toHTML()} ${this.operator} ${this.right.toHTML()}`
    }

    visit(visitor){
        this.left.visit(visitor);
        this.right.visit(visitor);
    }
}

class Sub extends BinaryAexp {

    get operator(){
        return "-"
    }

    eval(context){
        return this.left.eval(context) - this.right.eval(context);
    }

    visit(visitor){
        super.visit(visitor);
        return visitor.visitSub(this);
    }
}

class Mul extends BinaryAexp {

    get operator(){
        return "*"
    }

    eval(context){
        return this.left.eval(context) * this.right.eval(context);
    }

    visit(visitor){
        super.visit(visitor);
        return visitor.visitMul(this);
    }
}

class Bexp extends Expression {
    /**
     *
     * @param {Context} context
     */
    eval(context){
        throw "not yet implemented";
    }
}

class BinaryBexp extends Bexp {
    /**
     *
     * @param {Aexp} left
     * @param {Aexp} right
     */
    constructor(left, right){
        super();
        this.left = left;
        this.right = right;
    }

    /**
     * @return {String}
     */
    get operator(){
        return null
    }

    toHTML(){
        return `${this.left.toHTML()} ${this.operator} ${this.right.toHTML()}`
    }

    visit(visitor){
        this.left.visit(visitor);
        this.right.visit(visitor);
    }
}

class Bool extends Bexp {

    constructor(bool){
        super();
        this.value = bool;
    }

    toHTML(){
        return String(this.value)
    }

    visit(visitor){
        return visitor.visitBool(this)
    }

    eval(context){
        return this;
    }
}

class LowerEquals extends BinaryBexp {
    get operator(){
        return "<="
    }

    visit(visitor){
        super.visit(visitor);
        return visitor.visitLowerEquals(this)
    }

    eval(context){
        return new Bool(this.left.eval(context).value <= this.right.eval(context).value);
    }
}

class Not extends Bexp {

    /**
     *
     * @param  {Bexp} expression
     */
    constructor(expression){
        super();
        this.expression = expression
    }

    toHTML(){
        return "not " + this.expression.toHTML()
    }

    visit(visitor){
        this.expression.visit(visitor);
        return visitor.visitNot(this)
    }

    eval(context){
        return new Bool(!this.expression.eval(context).value);
    }
}

class And extends BinaryBexp {

    get operator(){
        return "&&"
    }

    visit(visitor){
        super.visit(visitor);
        return visitor.visitAnd(this)
    }

    eval(context){
        return new Bool(this.left.eval(context).value && this.right.eval(context).value);
    }
}

class Com extends ASTNode {

    constructor(){
        super();
    }
}

class Skip extends Com {

    constructor(){
        super();
    }

    toHTML(){
        return "skip"
    }

    visit(visitor){
        return visitor.visitSkip()
    }
}

class Ass extends Com {
    /**
     *
     * @param {Var} _var
     * @param {Aexp} expr
     */
    constructor(_var, expr){
        super();
        this.var = _var;
        this.expr = expr;
    }

    toHTML(){
        return `${this.var.name} := ${this.expr.toHTML()}`
    }

    visit(visitor){
        this.var.visit(visitor);
        this.expr.visit(visitor);
        return visitor.visitAss(this)
    }
}

class LocalAss extends Com {
    /**
     *
     * @param {Var} _var
     * @param {Aexp} expr
     * @param {Com} com
     */
    constructor(_var, expr, com){
        super();
        this.var = _var;
        this.expr = expr;
        this.com = com;
    }

    toHTML(){
        return `{var ${this.var.name} = ${this.expr.toHTML()}; ${this.com.toHTML()}}`
    }

    visit(visitor){
        this.var.visit(visitor);
        this.expr.visit(visitor);
        this.com.visit(visitor);
        return visitor.visitLocalAss(this)
    }
}

class Seq extends Com {
    /**
     *
     * @param {Com} com1
     * @param {Com} com2
     */
    constructor(com1, com2){
        super();
        this.com1 = com1;
        this.com2 = com2;
    }

    toHTML(){
        return `${this.com1.toHTML()}; ${this.com2.toHTML()}`
    }

    visit(visitor){
        this.com1.visit(visitor);
        this.com2.visit(visitor);
        return visitor.visitSeq(this);
    }
}

class If extends Com {
    /**
     *
     * @param {Bexp} cond condition
     * @param {Com} com1 true branch
     * @param {Com} com2 false branch
     */
    constructor(cond, com1, com2){
        super();
        this.cond = cond;
        this.com1 = com1;
        this.com2 = com2;
    }

    toHTML(){
        return `if (${this.cond.toHTML()}) then (${this.com1.toHTML()}) else (${this.com2.toHTML()})`
    }

    visit(visitor){
        this.cond.visit(visitor);
        this.com1.visit(visitor);
        this.com2.visit(visitor);
        return visitor.visitIf(this);
    }
}

class While extends Com {
    /**
     *
     * @param {Bexp} cond
     * @param {Com} body
     */
    constructor(cond, body){
       super();
       this.cond = cond;
       this.body = body;
    }

    toHTML(){
        return `while (${this.cond.toHTML()}) do (${this.body.toHTML()})`
    }

    visit(visitor){
        this.cond.visit(visitor);
        this.body.visit(visitor);
        return visitor.visitWhile(this)
    }
}

class EvalLine {
    toString(){}

    toHTML(){}
}

/**
 * A part of an evaluation that is equivalent to `B[b]\sigma = [boolean value]`
 */
class BoolEvalLine extends EvalLine {
    /**
     *
     * @param {Bexp} bexpr
     * @param {Bool} expValue
     * @param {Context} context
     */
    constructor(bexpr, expValue, context){
        super();
        this.bexpr = bexpr;
        this.expValue = expValue instanceof Bool ? expValue : new Bool(expValue);
        this.context = context;
    }

    toString(){
        return `B[<code>${this.bexpr.toHTML()}</code>] ${this.context.toShortHTMLString()} = ${this.expValue.toHTML()}`
    }

    toHTML(){
        return this.toString();
    }
}

/**
 * A line of a big step semantic evaluation
 * i.e. <c, \sigma> ↓ \sigma'
 * it tells us for a given start state \sigma and a given program c that a possible end state is \sigma'
 */
class ComEvalLine extends EvalLine {

    /**
     *
     * @param {Com} program
     * @param {Context} startState
     * @param {Context} endStates
     */
    constructor(program, startState, endState){
        super();
        this.program = program;
        this.startState = startState;
        this.endState = endState;
    }

    copy(){
        return new ComEvalLine(this.program, this.startState, this.endState);
    }

    toString(){
        let ret = `〈<code>${this.program.toHTML()}</code>, ${this.startState.toTooltippedHTML()}〉`
        if (this.endState instanceof Context) {
            return `${ret} ⇓ ${this.endState.toTooltippedHTML()}`
        }
        return ret;
    }

    toHTML(){
        return this.toString().replace("<=", "&lt;=")
    }
}

class Rule {
    constructor(name){
        this.name = name;
    }

    toString(){
        return this.name
    }
}

/**
 * A semantic evaluation step
 * e.g.
 *      A  B
 * Rule ----
 *       C
 */
class EvalStep {
    /**
     *
     * @param {Rule} appliedRule
     * @param {EvalLine} currentEvalLine
     * @param {EvalStep[]} resultingSteps
     */
    constructor(appliedRule, currentEvalLine, resultingSteps = []){
        this.appliedRule = appliedRule;
        this.currentEvalLine = currentEvalLine;
        this.resultingSteps = resultingSteps.map(x => x instanceof EvalStep ? x : new EvalStep(new Rule(""), x, []))
    }

    copy(){
        return new EvalStep(this.appliedRule, this.currentEvalLine.copy(), new Array(this.resultingSteps.map(x => x.copy())));
    }

    toHTML(){
        return `
<table style="margin: 0 auto;">
    <tr>
        ${this.resultingSteps.length > 0 ? this.resultingSteps.map(x => `<td>${x.toHTML()}</td>`).join("") : "<td></td>"}
        <td class="rulename" rowspan="2"><div class="rulename">${this.appliedRule.toString()}</div></td></tr>
    <tr><td class="${this.currentEvalLine instanceof BoolEvalLine ? "" : "conc"}" colspan="${Math.max(1, this.resultingSteps.length)}">${this.currentEvalLine.toHTML()}</td></tr>
</table>`
    }
}

class EvalBigSemantic {

    /**
     *
     * @param {Com} program
     * @param {Context} startContext
     * @param {Number} maxSteps
     */
    constructor(program, startContext, maxSteps = 100){
        this.program = program;
        this.evalLine = new ComEvalLine(program, startContext, null);
        this.startContext = startContext;
        this.maxSteps = maxSteps;
        this.steps = 0;
    }

    /** @return {EvalStep} */
    eval(){
        return this._dispatch(this.program, this.startContext)
    }

    /**
     *
     * @param {Com} com
     * @param {Context} startContext
     * @return {EvalStep}
     */
    _dispatch(com, startContext){
        if (this.maxSteps <= this.steps){
            console.error("Executed the maximum number of steps");
            return new EvalStep(new Rule("Executed the maximum number of steps"), new ComEvalLine(com, startContext, startContext));
        }
        this.steps +=1;
        let funcs = {
            "Skip": this._visitSkip,
            "Seq": this._visitSeq,
            "Ass": this._visitAss,
            "LocalAss": this._visitLocalAss,
            "If": this._visitIf,
            "While": this._visitWhile
        };
        return funcs[com.constructor.name].apply(this, [com, startContext])
    }

    /**
     * @param {Skip} com
     * @param {Context} startContext
     * @return {EvalStep} */
    _visitSkip(com, startContext){
        return new EvalStep(new Rule("Skip"), new ComEvalLine(com, startContext, startContext));
    }

    /**
     * @param {Ass} com
     * @param {Context} startContext
     * @return {EvalStep}
     */
    _visitAss(com, startContext){
        let newCon = startContext.setImm(com.var, arithmeticValue(com.expr, startContext));
        return new EvalStep(new Rule("Ass"), new ComEvalLine(com, startContext, newCon))
    }

    /**
     * @param {Seq} com
     * @param {Context} startContext
     * @return {EvalStep}
     */
    _visitSeq(com, startContext){
        let sigma_ = startContext;
        let com1Line = this._dispatch(com.com1, startContext);
        let com2Line = this._dispatch(com.com2, com1Line.currentEvalLine.endState);
        var endContext = com2Line.currentEvalLine.endState;
        return new EvalStep(new Rule("Seq"), new ComEvalLine(com, startContext, endContext), [com1Line, com2Line]);
    }

    /**
     * @param {If} com
     * @param {Context} startContext
     * @return {EvalStep}
     */
    _visitIf(com, startContext){
        let condVal = booleanValue(com.cond, startContext).value;
        let boolLine = new BoolEvalLine(com.cond, new Bool(condVal), startContext);
        let chosenCom = condVal ? com.com1 : com.com2;
        let chosenComLine = this._dispatch(chosenCom, startContext);
        let rule = new Rule(condVal ? "IfTT" : "IfFF");
        return new EvalStep(rule, new ComEvalLine(com, startContext, chosenComLine.currentEvalLine.endState), [boolLine, chosenComLine])
    }

    /**
     * @param {While} com
     * @param {Context} startContext
     * @return {EvalStep}
     */
    _visitWhile(com, startContext){
        let condVal = booleanValue(com.cond, startContext).value;
        let boolLine = new BoolEvalLine(com.cond, new Bool(condVal), startContext);
        let chosenCom = condVal ? com.com1 : com.com2;
        let rule = new Rule(condVal ? "WhileTT" : "WhileFF");
        if (condVal){
            let firstBodyEval = this._dispatch(com.body, startContext);
            let nextWhileEval = this._dispatch(com, firstBodyEval.currentEvalLine.endState);
            return new EvalStep(rule, new ComEvalLine(com, startContext, nextWhileEval.currentEvalLine.endState), [boolLine, firstBodyEval, nextWhileEval]);
        } else {
            return new EvalStep(rule, new ComEvalLine(com, startContext, startContext), [boolLine]);
        }
        return new EvalStep(rule, new ComEvalLine(com, startContext, chosenComLine.currentEvalLine.endState), [boolLine, chosenComLine]);
    }

    /**
     * @param {Seq} com
     * @param {Context} startContext
     * @return {EvalStep}
     */
    _visitSeq(com, startContext){
        let sigma_ = startContext;
        let com1Line = this._dispatch(com.com1, startContext);
        let com2Line = this._dispatch(com.com2, com1Line.currentEvalLine.endState);
        var endContext = com2Line.currentEvalLine.endState;
        return new EvalStep(new Rule("Seq"), new ComEvalLine(com, startContext, endContext), [com1Line, com2Line]);
    }

    /**
     * @param {LocalAss} com
     * @param {Context} startContext
     * @return {EvalStep}
     */
    _visitLocalAss(com, startContext){
        let sigma_ = startContext;
        var oldVal = startContext.getValue(com.var);
        let newContext = startContext.setImm(com.var, arithmeticValue(com.expr, startContext));
        let comLine = this._dispatch(com.com, newContext);
        let endContext = comLine.currentEvalLine.endState.setImm(com.var, oldVal);
        return new EvalStep(new Rule("Block"), new ComEvalLine(com, startContext, endContext), [comLine]);
    }
}

class SmallStepEvalSteps {

    /**
     *
     * @param {EvalLine[]} lines
     */
    constructor(lines){
        this.lines = lines
    }

    add(line){
        this.lines.push(line)
    }

    toHTML(){
        let arrow = "→<sub>1</sub> ";
        let firstLine = this.lines[0].toHTML();
        let hiddenFirst = `<span style="visibility: hidden">${firstLine}</span>`;
        return this.lines.map(x => `${x === this.lines[0] ? "" : (hiddenFirst + arrow)}${x.toHTML()}`).join("<br/>") + "<br/>" + hiddenFirst + arrow + "*";
    }
}

class EvalSmallSemantic {

    /**
     *
     * @param {Com} program
     * @param {Context} startContext
     * @param {Number} maxSteps
     */
    constructor(program, startContext, maxSteps = 100){
        this.program = program;
        this.evalLine = new ComEvalLine(program, startContext, null);
        this.startContext = startContext;
        this.maxSteps = maxSteps;
        this.steps = 0;
    }

    eval(){
        let evalSteps = new SmallStepEvalSteps([]);
        var last = this.evalLine;
        var changed = true;
        while (changed){
            evalSteps.add(last);
            let cur = this._dispatch(last);
            changed = cur.program !== last.program;
            last = cur
        }
        return evalSteps;
    }

    /**
     *
     * @param {EvalLine} line
     * @return {EvalLine}
     */
    _dispatch(line){
        if (this.maxSteps <= this.steps){
            console.error("Executed the maximum number of steps");
            return new ComEvalLine(line.program, line.endContext, line.endContext);
        }
        this.steps += 1;
        let funcs = {
            "Skip": this._visitSkip,
            "Seq": this._visitSeq,
            "Ass": this._visitAss,
            "LocalAss": this._visitLocalAss,
            "If": this._visitIf,
            "While": this._visitWhile
        };
        return funcs[line.program.constructor.name].apply(this, [line])
    }

    _firstNonSkip(line){

    }

    /**
     * @param {EvalLine} line
     * @return {EvalLine} */
    _visitSkip(line){
        return line;
    }

    /**
     * @param {EvalLine} line
     * @return {EvalLine} */
    _visitAss(line){
        let newCon = startContext.setImm(com.var, arithmeticValue(com.expr, startContext));
        return new EvalStep(new Rule("Ass"), new ComEvalLine(com, startContext, newCon))
    }

    /**
     * @param {Seq} com
     * @param {Context} startContext
     * @return {EvalStep}
     */
    _visitSeq(com, startContext){
        let sigma_ = startContext;
        let com1Line = this._dispatch(com.com1, startContext);
        let com2Line = this._dispatch(com.com2, com1Line.currentEvalLine.endState);
        var endContext = com2Line.currentEvalLine.endState;
        return new EvalStep(new Rule("Seq"), new ComEvalLine(com, startContext, endContext), [com1Line, com2Line]);
    }

    /**
     * @param {If} com
     * @param {Context} startContext
     * @return {EvalStep}
     */
    _visitIf(com, startContext){
        let condVal = booleanValue(com.cond, startContext).value;
        let boolLine = new BoolEvalLine(com.cond, new Bool(condVal), startContext);
        let chosenCom = condVal ? com.com1 : com.com2;
        let chosenComLine = this._dispatch(chosenCom, startContext);
        let rule = new Rule(condVal ? "IfTT" : "IfFF");
        return new EvalStep(rule, new ComEvalLine(com, startContext, chosenComLine.currentEvalLine.endState), [boolLine, chosenComLine])
    }

    /**
     * @param {While} com
     * @param {Context} startContext
     * @return {EvalStep}
     */
    _visitWhile(com, startContext){
        let condVal = booleanValue(com.cond, startContext).value;
        let boolLine = new BoolEvalLine(com.cond, new Bool(condVal), startContext);
        let chosenCom = condVal ? com.com1 : com.com2;
        let rule = new Rule(condVal ? "WhileTT" : "WhileFF");
        if (condVal){
            let firstBodyEval = this._dispatch(com.body, startContext);
            let nextWhileEval = this._dispatch(com, firstBodyEval.currentEvalLine.endState);
            return new EvalStep(rule, new ComEvalLine(com, startContext, nextWhileEval.currentEvalLine.endState), [boolLine, firstBodyEval, nextWhileEval]);
        } else {
            return new EvalStep(rule, new ComEvalLine(com, startContext, startContext), [boolLine]);
        }
        return new EvalStep(rule, new ComEvalLine(com, startContext, chosenComLine.currentEvalLine.endState), [boolLine, chosenComLine]);
    }

    /**
     * @param {Seq} com
     * @param {Context} startContext
     * @return {EvalStep}
     */
    _visitSeq(com, startContext){
        let sigma_ = startContext;
        let com1Line = this._dispatch(com.com1, startContext);
        let com2Line = this._dispatch(com.com2, com1Line.currentEvalLine.endState);
        var endContext = com2Line.currentEvalLine.endState;
        return new EvalStep(new Rule("Seq"), new ComEvalLine(com, startContext, endContext), [com1Line, com2Line]);
    }

    /**
     * @param {LocalAss} com
     * @param {Context} startContext
     * @return {EvalStep}
     */
    _visitLocalAss(com, startContext){
        let sigma_ = startContext;
        var oldVal = startContext.getValue(com.var);
        let newContext = startContext.setImm(com.var, arithmeticValue(com.expr, startContext));
        let comLine = this._dispatch(com.com, newContext);
        let endContext = comLine.currentEvalLine.endState.setImm(com.var, oldVal);
        return new EvalStep(new Rule("Block"), new ComEvalLine(com, startContext, endContext), [comLine]);
    }
}