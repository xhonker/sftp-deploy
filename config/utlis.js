const is = {
  obj: (a) => Object.prototype.toString.call(a) === '[object Object]',
};
export const deepMerge = (obj1, obj2) => {
  Object.keys(obj2).forEach((k) => {
    obj1[k] = (obj1[k] && is.obj(obj1[k]) && deepMerge(obj1[k], obj2[k])) || obj2[k];
  });
  return obj1;
};
