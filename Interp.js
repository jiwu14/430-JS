//interp the GUCI3 language

load("DefTypes.js");

//convert value to string
var serialize = function(value) {
   if (value instanceof Value) {
      switch(value.constructor) {
         case NumV:
         case BoolV:
            return value.val.toString();
            break;
         case ClosV:
            return "#<procedure>";
            break;
         default:
            throw "Invalid value";
      }
   } else {
      throw "Not a value";
   }
}

//fun - function to test
//args - argument array to pass to function
//expected - expected return value
var test = function(fun, args, expected) {
   let ret;
   try {
      ret = fun.apply(null, args);
      if (ret !== expected) {
         print("Failure: Expected "+expected.toSource()+", Got "+ret.toSource());
      }
   } catch(e) {
      if (e !== expected) {
         print("Failure: Expected "+expected.toSource()+", Got "+e.toSource());
      }
   }
}

test(serialize, [new ClosV()], "#<procedure>");
test(serialize, [new NumV(24)], "24");
test(serialize, [new BoolV(true)], "true");
test(serialize, [new BoolV(false)], "false");
test(serialize, [new NumC(7)], "Not a value");

//clone the environment
var GetCloneEnv = function(env) {
   let newEnv = {};
   for (var property in env) {
      newEnv[property] = env[property];
   }
   return newEnv;
}

var ensureNum = function(value) {
   if (value instanceof NumV) {
      return value.val;   
   } else {
      throw "Not a number";
   }
}

//do the interps
var interp = function interp(expr, env) {
   let interpS = function(ex) {
      return interp(ex, env);
   }
   // define build-env function here, so it's in scope
   let buildEnv = function(params, args, clos) {
      if (params.length !== args.length) {
         throw "Wrong arity";
      }
      let argVals = args.map(interpS);
      for (let ndx = 0; ndx < params.length; ndx++) {
         clos[params[ndx].val] = argVals[ndx];
      }
      return clos;
   }

   if (expr instanceof ExprC) {
      if ((typeof env) === 'undefined') {
         throw "Invalid environment";
      }
      
      switch(expr.constructor) {
         case NumC:
            return new NumV(expr.val);
         case BoolC:
            return new BoolV(expr.val);
         case IdC:
            let temp = env[expr.val];
            if ((typeof temp) === 'undefined') {
               throw "Free variable";
            }
            if (temp instanceof Value) {
               return temp;
            } else {
               throw "Not a value";
            }
         case LamC:
            return new ClosV(expr.params, expr.body, GetCloneEnv(env));
         case BinopC:
            let left = interp(expr.left, env);
            let right = interp(expr.right, env);
            switch (expr.op) {
               case "+":
                  return new NumV(ensureNum(left) + ensureNum(right));
               case "-":
                  return new NumV(ensureNum(left) - ensureNum(right));
               case "*":
                  return new NumV(ensureNum(left) * ensureNum(right));
               case "/":
                  if (ensureNum(right) !== 0) {
                     return new NumV(ensureNum(left) /  ensureNum(right));
                  }
                  throw "Divide by zero";
               case "<=":
                  return new BoolV(ensureNum(left) <= ensureNum(right));
               case "eq?":
                  if ((left instanceof NumV && right instanceof NumV) ||
                      (left instanceof BoolV && right instanceof BoolV)){
                     return new BoolV(left.val === right.val);
                  }
                  return new BoolV(false);
               default:
                  throw "Not a binop";
            } 
         case IfC:
            let cond = interp(expr.cond, env);
            if (cond instanceof BoolV) {
               if (cond.val === true) {
                  return interp(expr.then, env);
               } else {
                  return interp(expr.el, env);
               }
            } else {
               throw "Not a boolean";
            }
         case AppC:
            let lambda = interp(expr.lam, env);
            if (lambda instanceof ClosV) {
               //build env
               return interp(lambda.body, buildEnv(lambda.params, expr.args, lambda.env));
            }
            throw "Not a function";
         default:
            throw "Invalid expression";
      }
   } else {
      throw "Not a expression";
   }
}

var testEval = function(expr, expected, env) {
   let compute = function() {
      return serialize(interp(expr, env || {}));
   }
   test(compute, [], expected);
}

testEval(new BinopC("+", new NumC(2), new NumC(7)), "9");
testEval(new IfC(new BinopC("eq?", new BoolC(true), new BoolC(false)),
                 new NumC(10),
                 new BinopC("*", new IdC("x"), new IdC("y"))),
   "22",
   {x: new NumV(2),
    y: new NumV(11)});
testEval(new AppC(new LamC([new IdC("x")], new BinopC("*", new IdC("x"), new NumC(2))),
               [new NumC(70)]), "140");            
testEval(new AppC(new LamC([new IdC("seven")],
                        	new AppC(new IdC("seven"), [])),
              	   [new AppC(new LamC([new IdC("minus")],
                                     new LamC([],
                                          	 new AppC(new IdC("minus"),
                                                     	 [new BinopC("+",
                                                                 	 new NumC(3),
                                                                 	 new NumC(10)),
                                                     	  new BinopC("*",
                                                                	 new NumC(2),
                                                                	 new NumC(3))]))),
                        	 [new LamC([new IdC("x"), new IdC("y")],
                                     	new BinopC("+",
                                                  new IdC("x"),
                                                  new BinopC("*",
                                                          	 new NumC(-1),
                                                             new IdC("y"))))])]),
     	"7");
testEval(new AppC(new LamC([new IdC("a"), new IdC("b")],
                            new IfC(new BinopC("eq?",
                                                new BinopC("<=",
                                                        	  new IdC("a"),
                                                           new IdC("b")),
                                                new BoolC(false)),
                                    new IdC("z"),
                                    new IdC("v"))),
                  [new NumC(9), new NumC(15)]),
 	"4",
   {z: new NumV(10),
    v: new NumV(4)});

testEval(new AppC(new LamC([new IdC("x"), new IdC("y")],
                       	new BinopC("+",
                                  	new IdC("x"),
                                  	new IdC("y"))),
             	[new NumC(1), new NumC(2)]),
     	"3");

testEval(new NumC(50), "50")
testEval(new BoolC(true), "true")
testEval(new IfC(new BoolC(false),
             	new NumC(10),
             	new BinopC("/", new NumC(6), new NumC(3))), "2")
testEval(new BinopC("+",
                	new BinopC("-",
                           	new BinopC("*",
                                      	new BinopC("/",
                                                 	new NumC(2000),
                                                 	new NumC(40)),
                                      	new NumC(.5)),
                           	new NumC(26)),
                	new NumC(1)),
     	"0")
testEval(new BinopC("eq?",
                	new NumC(1),
                	new NumC(3)),
     	"false")
testEval(new BinopC("eq?",
                	new BoolC(true),
                	new BoolC(true)),
     	"true")
testEval(new BinopC("eq?",
                	new BoolC(false),
                	new NumC(7)),
     	"false")
testEval(new BinopC("eq?",
                	new NumC(7),
                	new BoolC(true)),
     	"false")
testEval(new LamC([], new NumC(7)), "#<procedure>")



/* Error Testing */
testEval(new IdC("x"), "Free variable")
testEval(new BinopC("/", new NumC(7), new NumC(0)), "Divide by zero")
testEval(new BinopC("*", new BoolC(true), new NumC(7)), "Not a number")
testEval(new AppC(new LamC([], new NumC(0)), [new NumC(4)]), "Wrong arity")
testEval(new BinopC("q", new NumC(0), new NumC(0)), "Not a binop")
testEval(new IfC(new NumC(20), new NumC(6), new BoolC(false)), "Not a boolean")
testEval(new AppC(new NumC(1), []), "Not a function")
testEval(new ExprC(), "Invalid expression")
testEval(new NumV(7), "Not a expression")
test(interp, [new NumC(7), undefined], "Invalid environment")
test(interp, [new IdC("x"), {x: new NumC(8)}], "Not a value")
