const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let width = 800,
  height = 800;
let text = "";
let isAnimate = false;
let sx = 0,
  sy = 0;
let gx = 0,
  gy = 0;
let totalDistance = 0;
let g0Distance = 0;
window.addEventListener("load", () => {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.width = canvas.width;
  ctx.height = canvas.height;
});
document.getElementById("apply-btn").addEventListener("click", () => {
  console.log("click");
  renderGCode();
});
const checkbox = document.getElementById("check-animate");

checkbox.addEventListener("change", (event) => {
  if (event.currentTarget.checked) {
    isAnimate = true;
  } else {
    isAnimate = false;
  }
});
let uploader = document.getElementById("file");
uploader.onchange = (e) => {
  // motion.open(e.target.files[0].path);
  readTextFile(e.target.files[0]);
  uploader.value = "";
};
canvas.onclick = () => {
  uploader.click();
};
async function renderGCode() {
  let isRelative = false;
  let backgroundColor = document.getElementById("bg-color").value;
  let g0Color = document.getElementById("g0-color").value;
  let g1Color = document.getElementById("g1-color").value;
  let g1a = Number(`0x${g1Color.substr(1, 2)}`);
  let g1r = Number(`0x${g1Color.substr(3, 2)}`);
  let g1g = Number(`0x${g1Color.substr(5, 2)}`);
  let g1b = Number(`0x${g1Color.substr(7, 2)}`);
  let lines = text.split("\n");
  let lastX = 0,
    lastY = 0,
    lastS = 0;
  let actions = [];
  let offsetX = document.getElementById("x-offset").value * 1.0,
    offsetY = document.getElementById("y-offset").value * 1.0;
  let xScale = document.getElementById("scale").value * 1.0,
    yScale = document.getElementById("scale").value * 1.0;
  console.time("time");
  let lastCmd, lastType;
  gx = 10000;
  gy = 10000;
  for (let i = 0, len = lines.length; i < len; i++) {
    let line = lines[i];
    line = line.toLowerCase();
    let keys = {};
    let currentKey;
    for (let k = 0, slen = line.length; k < slen; k++) {
      let c = line.charAt(k);
      if (
        c == "x" ||
        c == "y" ||
        c == "g" ||
        c == "m" ||
        c == "s" ||
        c == "f"
      ) {
        currentKey = c;
        keys[currentKey] = "";
      } else if (c == "\n" || c == " ") {
        continue;
      } else {
        keys[currentKey] += c;
      }
    }
    let type = keys["g"] ? "g" : keys["m"] ? "m" : lastType;
    let cmd = keys["g"]
      ? parseInt(keys["g"])
      : keys["m"]
      ? parseInt(keys["m"])
      : lastCmd;
    lastType = type;
    lastCmd = cmd;
    if (type == "g") {
      switch (cmd) {
        case 0:
        case 1:
          {
            let x = lastX,
              y = lastY,
              s = lastS;
            let action = new Action(type, cmd);
            if (keys["x"]) {
              x = parseFloat(keys["x"]);
              if (x < gx) {
                gx = x;
              }
              x = xScale * x + offsetX;
              lastX = x;
            }
            if (keys["y"]) {
              y = parseFloat(keys["y"]);
              if (y < gy) {
                gy = y;
              }
              y = yScale * y + offsetY;
              lastY = y;
            }
            if (keys["s"]) {
              s = parseFloat(keys["s"]);
              lastS = s;
            }
            action.x = x;
            action.y = y;
            action.s = s;
            actions.push(action);
          }
          break;
        default:
          let action = new Action(type, cmd);
          if (keys["x"]) {
            action.x = xScale * parseFloat(keys["x"]) + offsetX;
          }
          if (keys["y"]) {
            action.y = yScale * parseFloat(keys["y"]) + offsetY;
          }
          if (keys["s"]) {
            s = parseFloat(keys["s"]);
            action.s = s;
          }
          actions.push(action);
          break;
      }
    } else if (type == "m") {
      let action = new Action(type, cmd);
      if (keys["s"]) {
        action.s = parseInt(keys["s"]);
        lastS = action.s;
      }
      actions.push(action);
    }
    if (i % (len > 10000 ? 10000 : 100) == 0) {
      await delay(0);
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#000";
      ctx.font = "20px Arial";
      ctx.fillText(
        `loading...${Math.round((i / len) * 100)}%`,
        width / 2 - 40,
        height / 2
      );
    }
  }
  console.timeEnd("time");
  ctx.fillStyle = backgroundColor;
  await delay(100);
  ctx.fillRect(0, 0, width, height);
  (lastX = 0), (lastY = 0);
  await moveTo(ctx, 0, 0);
  let outputs = actions;
  let end = new Action("g", 0);
  end.x = 0;
  end.y = 0;
  (lastX = 0), (lastY = 0);
  console.log("start:", outputs.length);
  console.time("time");
  for (let i = 0, len = outputs.length; i < len; i++) {
    let action = outputs[i];
    if (action.cmd == 90 || action.cmd == 91) {
      isRelative = action.cmd == 91;
    } else if (action.cmd == 92) {
      lastX = action.x;
      lastY = action.y;
    } else if (action.cmd == 0 || action.s == 0) {
      ctx.strokeStyle = g0Color;
      ctx.beginPath();
      await moveTo(ctx, lastX, lastY);
      let dx = 0;
      let dy = 0;
      if (isRelative) {
        dx = action.x;
        dy = action.y;
        await lineTo(ctx, lastX + action.x, lastY + action.y);
      } else {
        dx = action.x - lastX;
        dy = action.y - lastY;
        await lineTo(ctx, action.x, action.y);
      }
      g0Distance += Math.sqrt(dx * dx + dy * dy);
      totalDistance += g0Distance;
      ctx.stroke();
    } else if (action.type == "m" && action.cmd == 3) {
      ctx.strokeStyle =
        action.s == 0
          ? `${g0Color}`
          : `rgba(${g1r},${g1g},${g1b},${((action.s / 1000) * g1a) / 256})`;
    } else {
      ctx.strokeStyle =
        action.s == 0
          ? `${g0Color}`
          : `rgba(${g1r},${g1g},${g1b},${((action.s / 1000) * g1a) / 256})`;
      ctx.beginPath();
      await moveTo(ctx, lastX, lastY);
      let dx = 0;
      let dy = 0;
      if (isRelative) {
        dx = action.x;
        dy = action.y;
        await lineTo(ctx, lastX + action.x, lastY + action.y);
      } else {
        dx = action.x - lastX;
        dy = action.y - lastY;
        await lineTo(ctx, action.x, action.y);
      }
      totalDistance += Math.sqrt(dx * dx + dy * dy);
      ctx.stroke();
    }
    let dx = isRelative ? action.x : action.x - lastX,
      dy = isRelative ? action.y : action.y - lastY;
    let dist = action.cmd == 0 ? 0 : dx * dx + dy * dy;
    (lastX = isRelative ? lastX + action.x : action.x),
      (lastY = isRelative ? lastY + action.y : action.y);
    document.getElementById("g0Distance").value = g0Distance / xScale;
    document.getElementById("totalDistance").value = totalDistance / xScale;
    if (i % (len > 5000 ? 20000 : 100) == 0 || isAnimate) await delay(0);
  }
  ctx.stroke();
  console.timeEnd("time");
}
function moveTo(ctx, x, y) {
  let xScale = document.getElementById("scale").value * 1.0,
    yScale = document.getElementById("scale").value * 1.0;
  x -= gx * xScale;
  y -= gy * yScale;
  return new Promise((resolve) => {
    sx = x;
    sy = y;
    ctx.moveTo(x, y);
    resolve();
  });
}
function lineTo(ctx, x, y) {
  let xScale = document.getElementById("scale").value * 1.0,
    yScale = document.getElementById("scale").value * 1.0;
  x -= gx * xScale;
  y -= gy * yScale;
  return new Promise(async (resolve) => {
    if (isAnimate) {
      let tx = x,
        ty = y;
      let dx = tx - sx,
        dy = ty - sy;
      let dist = dx * dx + dy * dy;
      if (dist < 1) {
        ctx.lineTo(x, y);
        return resolve();
      }
      let steps = Math.min(20, Math.floor(dist / 36) + 1);
      dx /= steps;
      dy /= steps;
      (x = sx), (y = sy);
      for (let i = 0; i < steps; i++) {
        (x += dx), (y += dy);
        ctx.lineTo(x, y);
        ctx.stroke();
        await delay(8);
      }
    } else {
      ctx.lineTo(x, y);
    }
    resolve();
  });
}
function readTextFile(file) {
  let reader = new FileReader();
  reader.addEventListener("load", async (e) => {
    text = e.target.result;
    renderGCode();
  });
  reader.readAsText(file);
}
async function delay(time) {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}
class Action {
  constructor(type, cmd) {
    this.type = type;
    this.cmd = cmd;
    this._x = 0;
    this._y = 0;
    this._s = 0;
  }
  set x(v) {
    this._x = v;
  }
  get x() {
    return this._x;
  }
  set y(v) {
    this._y = v;
  }
  get y() {
    return this._y;
  }
  set s(v) {
    this._s = v;
  }
  get s() {
    return this._s;
  }
}
