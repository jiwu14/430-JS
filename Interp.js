//interp the GUCI3 language

load("DefTypes.js");

//convert value to string
var serialize = function(value) {
   if (value instanceof Value) {
      switch(value.constructor) {
         case NumV:
            return value.val.toString();
            break;
         case BoolV:
            if (value.val) {
               return "true";
            }
            return "false";
            break;
         case ClosV:
            return "#<procedure>";
            break;
         default:
            throw "Invalid value";
      }
   } else {
      return value;
   }
}

//fun - function to test
//args - argument array to pass to function
//expected - expected return value
var test = function(fun, args, expected) {
   let ret;
   try {
      ret = serialize(fun.apply(null, args));
      if (ret !== expected) {
         print("Failure: Expected "+expected+", Got "+ret);
      }
   } catch(e) {
      if (e !== expected) {
         print("Failure: Expected "+expected+", Got "+e);
      }
   }
   
}

test(serialize, [new ClosV()], "#<procedure>");
test(serialize, [new NumV(24)], "24");
test(serialize, [new BoolV(true)], "true");
test(serialize, [new BoolV(false)], "false");

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

var testEval = function(expr, expected) {
   test(interp, [expr, {}], expected);
}

testEval(new BinopC("+", new NumC(2), new NumC(7)), "9");
test(interp, [new IfC(new BinopC("eq?", new BoolC(true), new BoolC(false)),
                      new NumC(10),
                      new BinopC("*", new IdC("x"), new IdC("y"))),
             {x: new NumV(2),
              y: new NumV(11)}],
     "22");
testEval(new AppC(new LamC([new IdC("x")], new BinopC("*", new IdC("x"), new NumC(2))),
               [new NumC(70)]), "140");            

