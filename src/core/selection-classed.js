d3_selectionPrototype.classed = function(name, value) {
  if (arguments.length < 2) {

    // For classed(function), the function must return an object for each
    // element, specifying the names of classes to add or remove. The values
    // must be constants, not functions.
    if ((value = typeof name) === "function") {
      return this.each(function() {
        var x = name.apply(this, arguments);
        for (value in x) d3_selection_classed(value, x[value]).apply(this, arguments);
      });
    }

    // For classed(string), return true only if the first node has the specified
    // class or classes. Note that even if the browser supports DOMTokenList, it
    // probably doesn't support it on SVG elements (which can be animated).
    if (value === "string") {
      var node = this.node(),
          n = (name = name.trim().split(/^|\s+/g)).length,
          i = -1;
      if (value = node.classList) {
        while (++i < n) if (!value.contains(name[i])) return false;
      } else {
        value = node.className;
        if (value.baseVal != null) value = value.baseVal;
        while (++i < n) if (!d3_selection_classedRe(name[i]).test(value)) return false;
      }
      return true;
    }

    // For classed(object), the object specifies the names of classes to add or
    // remove. The values may be functions that are evaluated for each element.
    for (value in name) this.each(d3_selection_classed(value, name[value]));
    return this;
  }

  // Otherwise, both a name and a value are specified, and are handled as below.
  return this.each(d3_selection_classed(name, value));
};

function d3_selection_classedRe(name) {
  return new RegExp("(?:^|\\s+)" + d3.requote(name) + "(?:\\s+|$)", "g");
}

// Multiple class names are allowed (e.g., "foo bar").
function d3_selection_classed(name, value) {
  name = name.trim().split(/\s+/).map(d3_selection_classedName);
  var n = name.length;

  function classedConstant() {
    var i = -1;
    while (++i < n) name[i](this, value);
  }

  // When the value is a function, the function is still evaluated only once per
  // element even if there are multiple class names.
  function classedFunction() {
    var i = -1, x = value.apply(this, arguments);
    while (++i < n) name[i](this, x);
  }

  return typeof value === "function"
      ? classedFunction
      : classedConstant;
}

function d3_selection_classedName(name) {
  var re = d3_selection_classedRe(name);
  return function(node, value) {
    if (c = node.classList) return value ? c.add(name) : c.remove(name);
    var c = node.className,
        cb = c.baseVal != null,
        cv = cb ? c.baseVal : c;
    if (value) {
      re.lastIndex = 0;
      if (!re.test(cv)) {
        cv = d3_collapse(cv + " " + name);
        if (cb) c.baseVal = cv;
        else node.className = cv;
      }
    } else if (cv) {
      cv = d3_collapse(cv.replace(re, " "));
      if (cb) c.baseVal = cv;
      else node.className = cv;
    }
  };
}
