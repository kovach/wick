// Utilities for parsing newline separated lists.

var mkParser = function(lines) {
  return {lines: lines};
}
var lines = function(state) {
  return state.lines
}
var takeLine = function(state, f) {
  var line = state.lines.shift();
  if (line.length !== 0) {
    f(line);
  } else {
    state.done = true;
  }
  return state;
}

var takeLines = function(state, f) {
  state.done = false;
  while (!state.done) {
    state = takeLine(state, f);
  }
  return state;
}

module.exports = {
  mkParser: mkParser,
  takeLine: takeLine,
  takeLines: takeLines,
  lines: lines,
}
