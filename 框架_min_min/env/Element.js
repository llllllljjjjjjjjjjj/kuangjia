Element = function Element() {
  ldvm.toolsFunc.throwError("TypeError", "Failed to construct 'Element': Illegal constructor");
};
ldvm.toolsFunc.safeProto(Element, "Element");
Object.setPrototypeOf(Element.prototype, Node.prototype);

