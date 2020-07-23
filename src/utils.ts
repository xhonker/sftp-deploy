export const sizeConversion = (size: number): string => {
  let b = 1 * 1024;
  let kb = b * 1024;
  let mb = kb * b;
  let gb = mb * b
  let result = '';
  if (size < b) {
    result = `${size.toFixed(2)}B`
  } else if (size < kb) {
    result = `${(size / b).toFixed(2)}KB`
  } else if (size < mb) {
    result = `${(size / kb).toFixed(2)}MB`
  } else if (size < gb) {
    result = `${(size / mb).toFixed(2)}GB`
  } else {
    result = `${(size / gb).toFixed(2)}TB`
  }


  if (result.endsWith('.00')) {
    return result.substring(0, result.length - 3)
  }

  return result;
}