export const rand = (min, max) =>
  min + Math.floor(Math.random() * (max - min + 1));

const pickRandom = arr => arr[rand(0, arr.length - 1)];

export const sample = (arr, amount) => {
  if (!arr || arr.length === 0) {
    return undefined;
  }
  if (typeof amount !== "number") {
    return pickRandom(arr);
  }
  const am = amount > arr.length ? arr.length : amount;
  const ret = [];
  for (let i = 0; i < am; ++i) {
    let candidate = pickRandom(arr);
    while (ret.includes(candidate)) {
      candidate = pickRandom(arr);
    }
    ret.push(candidate);
  }
  return ret;
};
