let monthsData = [];
let particles = [];
let keyMapping = {};

// 控制文字闪光的变量 (0.0 = 灰色, 1.0 = 黄色)
let textGlowAmt = 0; 

function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(CENTER, CENTER);
  rectMode(CENTER); 
  
  initMonthData();
  setupKeyMapping();
}

function draw() {
  background(0); // 背景黑

  // 1. 处理闪光数值的衰减 (让光慢慢熄灭)
  // 这里的 0.1 控制褪色速度，越小褪色越慢
  textGlowAmt = lerp(textGlowAmt, 0, 0.1); 

  // 2. 绘制会闪光的文字
  drawIntroText();

  // 3. 物理引擎
  runPhysics();
}

function keyPressed() {
  let k = key.toLowerCase();
  
  if (keyCode === DELETE || keyCode === BACKSPACE) {
    particles = particles.filter(p => !p.isSelected);
    return;
  }

  if (k in keyMapping) {
    spawnParticle(keyMapping[k]);
    // --- 触发文字微光 ---
    // 设置为 0.6 而不是 1，表示"微微"闪光，不要太刺眼
    textGlowAmt = 0.8; 
  }
}

function mousePressed() {
  for (let p of particles) {
    p.checkSelection(mouseX, mouseY);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// --- 文字绘制 (核心修改部分) ---

function drawIntroText() {
  push();
  // 位置保持在中上部
  translate(width / 2, height * 0.38); 
  noStroke();
  
  // --- 动态计算颜色 ---
  let baseColor = color(100); // 基础颜色：深灰
  let flashColor = color(255, 245, 180); // 闪光颜色：暖黄
  
  // 根据 textGlowAmt 在灰色和黄色之间混合
  let currentColor = lerpColor(baseColor, flashColor, textGlowAmt);
  
  fill(currentColor); 
  
  // 1. 大标题 
  let titleSize = min(width, height) * 0.035; 
  textSize(titleSize);
  textStyle(BOLD);
  text("摸鱼解压日历\nSTRESS RELIEF CALENDAR", 0, 0);
  
  // 2. 副标题 
  textSize(titleSize * 0.45);
  textStyle(NORMAL);
  textLeading(titleSize * 0.6); 
  text("工作太累？想放假？在这里堆满你的假期!!!。\nTired of work? Fill this space with your holidays.", 0, titleSize * 2.2);
  
  // 3. 操作指南
  // 操作指南也可以跟着闪，或者你想让它保持灰色也可以
  // 这里我让它也跟着微闪，保持整体感
  textSize(titleSize * 0.4);
  let gap = titleSize * 4.5; 
  
  text("———————— 操作指南 / HOW TO PLAY ————————", 0, gap);
  
  text("按键 [ 1-9 ] [ O ] [ N ] [ D ] 发射月份\nPress keys [ 1-9 ] [ O ] [ N ] [ D ] for Jan - Dec", 0, gap + titleSize * 1.8);
  
  text("点击数字选中 -> 按 [ Delete ] 清除\nClick to select -> Press [ Delete ] to clear", 0, gap + titleSize * 3.8);
  
  pop();
}

// --- 物理引擎 ---

function runPhysics() {
  for (let p of particles) {
    p.applyForces();
    p.update();
  }

  for (let k = 0; k < 3; k++) {
    for (let i = 0; i < particles.length; i++) {
      particles[i].checkEdges();
      for (let j = i + 1; j < particles.length; j++) {
        particles[i].checkCollision(particles[j]);
      }
    }
  }

  for (let p of particles) {
    p.display();
  }
}

function spawnParticle(monthIndex) {
  let mData = monthsData[monthIndex];
  let dateText = mData.dates[mData.currentIndex];
  mData.currentIndex = (mData.currentIndex + 1) % mData.dates.length;
  let origin = getOriginPosition(monthIndex);
  particles.push(new DateParticle(origin.x, origin.y, dateText, mData.color, origin.side));
}

function getOriginPosition(index) {
  let x, y, side;
  if (index >= 0 && index <= 3) {
    side = 'left'; x = 0; y = height - (index + 1) * (height / 5); 
  } else if (index >= 4 && index <= 7) {
    side = 'top'; y = 0; x = (index - 3) * (width / 5);
  } else if (index >= 8 && index <= 11) {
    side = 'right'; x = width; y = (index - 7) * (height / 5);
  }
  if(side === 'left' || side === 'right') y += random(-20, 20);
  if(side === 'top') x += random(-20, 20);
  return {x, y, side};
}

class DateParticle {
  constructor(x, y, text, col, side) {
    this.pos = createVector(x, y);
    this.text = text;
    this.color = col;
    this.isSelected = false;
    this.scale = 0.1; 
    this.targetScale = 1;
    this.baseSize = 48; 
    this.radius = 24;   
    
    let speedX = 0, speedY = 0;
    if (side === 'left') {
      speedX = random(5, 12); speedY = random(-10, -5); 
    } else if (side === 'top') {
      speedX = random(-3, 3); speedY = random(2, 8);
    } else if (side === 'right') {
      speedX = random(-12, -5); speedY = random(-10, -5); 
    }
    this.vel = createVector(speedX, speedY);
  }

  applyForces() {
    this.vel.add(createVector(0, 0.4));
    this.vel.mult(0.99); 
    this.scale = lerp(this.scale, this.targetScale, 0.08); 
  }

  update() { this.pos.add(this.vel); }
  
  checkEdges() {
    let r = this.radius * this.scale;
    if (this.pos.y > height - r) {
      this.pos.y = height - r; this.vel.y *= -0.4; this.vel.x *= 0.8;  
    }
    if (this.pos.x < r) {
      this.pos.x = r; this.vel.x *= -0.5;
    } else if (this.pos.x > width - r) {
      this.pos.x = width - r; this.vel.x *= -0.5;
    }
  }

  checkCollision(other) {
    let r1 = this.radius * this.scale;
    let r2 = other.radius * other.scale;
    let minDist = r1 + r2;
    let d = p5.Vector.dist(this.pos, other.pos);
    if (d < minDist && d > 0) {
      let pushVec = p5.Vector.sub(this.pos, other.pos).normalize();
      let force = (minDist - d) * 0.5;
      this.pos.add(p5.Vector.mult(pushVec, force));
      other.pos.sub(p5.Vector.mult(pushVec, force));
      let combinedVel = p5.Vector.add(this.vel, other.vel).mult(0.5);
      this.vel.lerp(combinedVel, 0.5);
      other.vel.lerp(combinedVel, 0.5);
    }
  }

  display() {
    push();
    translate(this.pos.x, this.pos.y);
    let currentSize = this.baseSize * this.scale;
    textSize(currentSize);
    if (this.isSelected) { stroke(255); strokeWeight(4); } else { noStroke(); }
    fill(this.color);
    text(this.text, 0, 0);
    pop();
  }
  
  checkSelection(mx, my) {
    let r = this.radius * this.scale;
    if (dist(mx, my, this.pos.x, this.pos.y) < r) this.isSelected = !this.isSelected;
  }
}

function setupKeyMapping() {
  keyMapping['1'] = 0; keyMapping['2'] = 1; keyMapping['3'] = 2;
  keyMapping['4'] = 3; keyMapping['5'] = 4; keyMapping['6'] = 5;
  keyMapping['7'] = 6; keyMapping['8'] = 7; keyMapping['9'] = 8;
  keyMapping['o'] = 9; keyMapping['n'] = 10; keyMapping['d'] = 11; 
}

function initMonthData() {
  monthsData = [
    { dates: [1,2,3,10,11,17,18,24,25,31], color: "#FEF852", currentIndex: 0 },
    { dates: [1,7,8,15,16,17,18,19,20,21,22,23], color: "#EF333A", currentIndex: 0 },
    { dates: [1,7,8,14,15,21,22,28,29], color: "#A4D165", currentIndex: 0 },
    { dates: [4,5,6,11,12,18,19,25,26], color: "#FFFFFF", currentIndex: 0 },
    { dates: [1,2,3,4,5,10,16,17,23,24,30,31], color: "#F18D83", currentIndex: 0 },
    { dates: [6,7,13,14,19,20,21,27,28], color: "#FEF852", currentIndex: 0 },
    { dates: [4,5,11,12,18,19,25,26], color: "#2550B3", currentIndex: 0 },
    { dates: [1,2,8,9,15,16,22,23,29,30], color: "#F0AE53", currentIndex: 0 },
    { dates: [5,6,12,13,19,25,26,27], color: "#26A460", currentIndex: 0 },
    { dates: [1,2,3,4,5,6,7,11,17,18,24,25,31], color: "#BBA783", currentIndex: 0 },
    { dates: [1,7,8,14,15,21,22,28,29], color: "#BBA783", currentIndex: 0 },
    { dates: [5,6,12,13,19,20,26,27], color: "#27AAE1", currentIndex: 0 }
  ];
}