// The smallest rectangle of a rendered page that has anything printed on it.
//
// A region worked out from the text's positions is generous on purpose, so nothing is clipped; this trims the
// white back off afterwards. Used when cutting pictures out of a PDF, both by the build script and in the
// browser, so a picture is cropped the same way wherever it was made.

const NEARLY_WHITE = 235;

export function inkBounds({ data, width, height }) {
  const inked = (x, y) => {
    const i = (y * width + x) * 4;
    return data[i] < NEARLY_WHITE || data[i + 1] < NEARLY_WHITE || data[i + 2] < NEARLY_WHITE;
  };
  const rowInked = y => {
    for (let x = 0; x < width; x++) if (inked(x, y)) return true;
    return false;
  };
  let top = 0;
  let bottom = height - 1;
  while (top <= bottom && !rowInked(top)) top++;
  if (top > bottom) return null;               // nothing was printed here
  while (!rowInked(bottom)) bottom--;
  const colInked = x => {
    for (let y = top; y <= bottom; y++) if (inked(x, y)) return true;
    return false;
  };
  let left = 0;
  let right = width - 1;
  while (!colInked(left)) left++;
  while (!colInked(right)) right--;
  return { x: left, y: top, w: right - left + 1, h: bottom - top + 1 };
}
