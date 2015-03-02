//interp the GUCI3 language

load("DefTypes.js");

var test = function(value, expected) {
   if (value !== expected) {
      print("Failure: Expected "+expected.toSource()+", Got "+value.toSource());
   }
}

//clone the environment
var GetCloneEnv = function(env) {
   let newEnv = {};
   for (var property in env) {
      newEnv[property] = env[property];
   }
   return newEnv;
}

let testEnv = {x : new NumV(1)};
let cloneTestEnv = GetCloneEnv(testEnv);
testEnv.y = new NumV(2);
print(testEnv.toSource());
print(cloneTestEnv.toSource());
test(testEnv, cloneTestEnv);
test(2,2);

//do the interps
var interp = function(expr, env) {
   
}

//convert value to string
var serialize = function(value) {

}

//shit tons of tests:
