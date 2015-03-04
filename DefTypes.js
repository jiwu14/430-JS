//Define types for GUCI3

var ExtendClass = function(childClass, parentClass) {
   childClass.prototype = Object.create(parentClass.prototype);
   childClass.prototype.constructor = childClass;
}

var ExprC = function() {}

var NumC = function(x) {
   ExprC.apply(this);
   this.val = x;
}
ExtendClass(NumC, ExprC);

var BoolC = function(x) {
   ExprC.apply(this);
   this.val = x;
}
ExtendClass(BoolC, ExprC);

var IdC = function(x) {
   ExprC.apply(this);
   this.val = x;
}
ExtendClass(IdC, ExprC);

var IfC = function(cond, then, el) {
   ExprC.apply(this);
   this.cond = cond;
   this.then = then;
   this.el = el;
}
ExtendClass(IfC, ExprC);

var BinopC = function(op, left, right) {
   ExprC.apply(this);
   this.op = op;
   this.left = left;
   this.right = right;
}
ExtendClass(BinopC, ExprC);

var LamC = function(params, body){
   ExprC.apply(this);
   this.params = params;
   this.body = body;
}
ExtendClass(LamC, ExprC);

var AppC = function(lam, args) {
   ExprC.apply(this);
   this.lam = lam;
   this.args = args;
}
ExtendClass(AppC, ExprC);

//value types
var Value = function() {}

var NumV = function(x) {
   Value.apply(this);
   this.val = x;
}
ExtendClass(NumV, Value);

var BoolV = function(x) {
   Value.apply(this);
   this.val = x;
}
ExtendClass(BoolV, Value);

var ClosV = function(params, body, env) {
   Value.apply(this);
   this.params = params;
   this.body = body;
   this.env = env;
}
ExtendClass(ClosV, Value);
