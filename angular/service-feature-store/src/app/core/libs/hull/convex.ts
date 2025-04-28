function _ccw(p1, p2, p3) {
  return (p2[0] - p1[0]) * (p3[1] - p1[1]) - (p2[1] - p1[1]) * (p3[0] - p1[0]) <= 0;
}

function _tangent(pointset) {
  const res = [];
  for (let t = 0; t < pointset.length; t++) {
    while (res.length > 1 && _ccw(res[res.length - 2], res[res.length - 1], pointset[t])) {
      res.pop();
    }
    res.push(pointset[t]);
  }
  res.pop();
  return res;
}

// pointset has to be sorted by X
export function convexHull(pointset) {
  const upper = _tangent(pointset),
    lower = _tangent(pointset.reverse());
  const convex = lower.concat(upper);
  convex.push(pointset[0]);
  return convex;
}
