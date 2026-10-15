// dom.js — lil helpers so every ui file isn't typing document.getElementById 40 times
export const $ = (id) => document.getElementById(id);

export function el(tag, props = {}, children = []) {
  const node = Object.assign(document.createElement(tag), props);
  for (const c of children) node.append(c);
  return node;
}
