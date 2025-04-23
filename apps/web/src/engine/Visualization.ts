import { shotsTable } from '@/db/schema';

// All units are in feet

// 50mm (0.16 ft)
const LINE_WIDTH = 0.16;

const GRID_SIZE = 50;

// Distance between sideline and three-point line
const THREE_POINT_LINE_DISTANCE = 3;

// Real length is 14ft, but 14.15 aligns better
const THREE_POINT_LINE_STRAIGHT_LENGTH = 14;

// Radius of the three-point line from the basket
const THREE_POINT_LINE_RADIUS = 23.75;

const FREE_THROW_CIRCLE_RADIUS = 6;

const BACKBOARD_DISTANCE_TO_BACKLINE = 4;
const BASKET_DISTANCE_TO_BACKLINE = 5.25;
const BASKET_RADIUS = 3 / 4;

const RESTRICTED_LINE_LENGTH = 15 / 12;
const RESTRICTED_CIRCLE_RADIUS = 4;
const RESTRICTED_AREA_WIDTH = 8;

const BACKBOARD_WIDTH = 5;
const BACKBOARD_DEPTH = 0.3;

const PAINTED_AREA = {
  width: 16,
  length: 19,
};

const FULL_COURT_LENGTH_FT = 94;
const COURT_LENGTH_FT = FULL_COURT_LENGTH_FT * 0.4;
const COURT_WIDTH_FT = 50;

const COURT_ASPECT_RATIO = COURT_WIDTH_FT / COURT_LENGTH_FT;

// const THEME = {
//   background: '#242424',
//   line: '#ffffff',
//   paintedArea: '#ffffff',
// };

const THEME = {
  background: '#ffffff',
  line: '#555555',
  paintedArea: '#353535',
};

interface ShotSection {
  // X and Y in the GRID_SIZExGRID_SIZE grid
  x: number;
  y: number;

  quantity: number;
  fieldGoalPercentage: number;

  totalMade: number;
  totalMissed: number;
}

export class VisualizationEngine {
  private ctx: CanvasRenderingContext2D;
  private size = { width: 0, height: 0, sectionSize: 0 };
  private abortController = new AbortController();
  private shots = new Map<number, ShotSection>();

  private mostShots = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    private container: HTMLDivElement
  ) {
    const ctx = this.canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas context is not available');
    }

    this.ctx = ctx;

    this.onResize();
    this.bindEvents();

    this.draw();
  }

  private getShotKey(x: number, y: number) {
    return x + y * GRID_SIZE;
  }

  setShots(shots: (typeof shotsTable.$inferSelect)[]) {
    this.shots.clear();

    for (const shot of shots) {
      const { x, y } = this.positionToSection(
        this.size.width / 2 - (this.size.width / 2) * (Number(shot.locX) / 25),
        this.feetToPixels(Number(shot.locY))
      );

      const key = this.getShotKey(x, y);

      const section = this.shots.get(key);

      if (section) {
        if (shot.shotMade) {
          section.totalMade++;
        } else {
          section.totalMissed++;
        }
      } else {
        this.shots.set(key, {
          x,
          y,
          quantity: 0,
          fieldGoalPercentage: 0,
          totalMade: Number(shot.shotMade),
          totalMissed: Number(shot.shotMade) === 0 ? 1 : 0,
        });
      }
    }

    this.shots.values().forEach((section) => {
      section.quantity = section.totalMade + section.totalMissed;
      section.fieldGoalPercentage = section.totalMade / section.quantity;

      if (section.quantity > this.mostShots) {
        this.mostShots = section.quantity;
      }
    });

    this.draw();
  }

  destroy() {}

  private draw() {
    this.drawCourt();
    this.drawShots();
  }

  private positionToSection(x: number, y: number) {
    const xSection = Math.round(x / this.size.sectionSize);
    const ySection = Math.floor(y / this.size.sectionSize);

    return {
      x: xSection,
      y: ySection,
    };
  }

  private sectionToPosition(x: number, y: number) {
    return {
      x: x * this.size.sectionSize,
      y: y * this.size.sectionSize,
    };
  }

  private drawShots() {
    this.shots.forEach((shot) => {
      this.drawShot(shot);
    });

    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        this.ctx.save();
        this.ctx.globalAlpha = 0.02;
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = THEME.line;
        this.ctx.strokeRect(
          this.size.sectionSize * i,
          this.size.sectionSize * j,
          this.size.sectionSize,
          this.size.sectionSize
        );
        this.ctx.stroke();
        this.ctx.restore();
      }
    }
  }

  private drawShot(shot: ShotSection) {
    const size = Math.max(
      this.size.sectionSize * (shot.quantity / this.mostShots),
      this.size.sectionSize * 0.25
    );

    const { x, y } = this.sectionToPosition(shot.x, shot.y);

    const color = getAccuracyColor(shot.fieldGoalPercentage);
    this.ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;

    this.ctx.beginPath();
    this.ctx.roundRect(
      x + (this.size.sectionSize - size) / 2,
      y + (this.size.sectionSize - size) / 2,
      size,
      size,
      size * 0.1
    );
    this.ctx.closePath();
    this.ctx.fill();
  }

  private drawCourt() {
    this.ctx.clearRect(0, 0, this.size.width, this.size.height);
    this.ctx.fillStyle = THEME.background;
    this.ctx.fillRect(0, 0, this.size.width, this.size.height);

    // Draw the court lines
    // Border
    const lineWidth = this.feetToPixels(LINE_WIDTH);
    this.ctx.lineWidth = lineWidth;
    this.ctx.strokeStyle = THEME.line;

    this.ctx.save();
    this.ctx.lineWidth = lineWidth * 2;
    this.ctx.strokeRect(0, 0, this.size.width, this.size.height);
    this.ctx.restore();

    // Three-point line (two straight lines and one arc)
    this.ctx.beginPath();
    this.ctx.moveTo(this.feetToPixels(THREE_POINT_LINE_DISTANCE), 0);

    this.ctx.lineTo(
      this.feetToPixels(THREE_POINT_LINE_DISTANCE),
      this.feetToPixels(THREE_POINT_LINE_STRAIGHT_LENGTH)
    );

    this.ctx.arc(
      this.size.width / 2,
      this.feetToPixels(BASKET_DISTANCE_TO_BACKLINE),
      this.feetToPixels(THREE_POINT_LINE_RADIUS),
      this.degToRad(180 - 22.5),
      this.degToRad(360 + 22),
      true
    );

    this.ctx.lineTo(
      this.size.width - this.feetToPixels(THREE_POINT_LINE_DISTANCE),
      0
    );

    this.ctx.stroke();

    this.ctx.beginPath();
    const backboardWidth = this.feetToPixels(BACKBOARD_WIDTH);
    const backboardDistanceToBackline = this.feetToPixels(
      BACKBOARD_DISTANCE_TO_BACKLINE
    );

    // Backboard
    this.ctx.moveTo(
      this.size.width / 2 - backboardWidth / 2,
      backboardDistanceToBackline
    );
    this.ctx.lineTo(
      this.size.width / 2 + backboardWidth / 2,
      backboardDistanceToBackline
    );
    this.ctx.save();
    this.ctx.lineWidth = this.feetToPixels(BACKBOARD_DEPTH);
    this.ctx.stroke();
    this.ctx.restore();

    this.ctx.beginPath();
    this.ctx.save();
    this.ctx.globalAlpha = 0.15;
    this.ctx.fillStyle = THEME.paintedArea;
    this.ctx.fillRect(
      this.size.width / 2 - this.feetToPixels(PAINTED_AREA.width) / 2,
      0,
      this.feetToPixels(PAINTED_AREA.width),
      this.feetToPixels(PAINTED_AREA.length)
    );
    this.ctx.restore();
    this.ctx.strokeRect(
      this.size.width / 2 - this.feetToPixels(PAINTED_AREA.width) / 2,
      0,
      this.feetToPixels(PAINTED_AREA.width),
      this.feetToPixels(PAINTED_AREA.length)
    );
    this.ctx.stroke();

    const basketRadius = this.feetToPixels(BASKET_RADIUS);

    this.ctx.beginPath();
    this.ctx.moveTo(
      this.size.width / 2,
      this.feetToPixels(BACKBOARD_DISTANCE_TO_BACKLINE)
    );
    this.ctx.lineTo(
      this.size.width / 2,
      this.feetToPixels(BASKET_DISTANCE_TO_BACKLINE) - basketRadius
    );

    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.arc(
      this.size.width / 2,
      this.feetToPixels(BASKET_DISTANCE_TO_BACKLINE),
      basketRadius,
      0,
      2 * Math.PI
    );
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.arc(
      this.size.width / 2,
      this.feetToPixels(PAINTED_AREA.length),
      this.feetToPixels(FREE_THROW_CIRCLE_RADIUS),
      this.degToRad(0),
      this.degToRad(180)
    );
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.arc(
      this.size.width / 2,
      this.feetToPixels(PAINTED_AREA.length),
      this.feetToPixels(FREE_THROW_CIRCLE_RADIUS),
      this.degToRad(180),
      this.degToRad(360)
    );
    this.ctx.setLineDash([10, 10]);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    this.ctx.beginPath();
    this.ctx.moveTo(
      this.size.width / 2 - this.feetToPixels(RESTRICTED_AREA_WIDTH / 2),
      this.feetToPixels(BACKBOARD_DISTANCE_TO_BACKLINE)
    );

    this.ctx.lineTo(
      this.size.width / 2 - this.feetToPixels(RESTRICTED_AREA_WIDTH / 2),
      this.feetToPixels(BACKBOARD_DISTANCE_TO_BACKLINE) +
        this.feetToPixels(RESTRICTED_LINE_LENGTH)
    );

    this.ctx.arc(
      this.size.width / 2,
      this.feetToPixels(BASKET_DISTANCE_TO_BACKLINE),
      this.feetToPixels(RESTRICTED_CIRCLE_RADIUS),
      this.degToRad(180),
      this.degToRad(360),
      true
    );

    this.ctx.lineTo(
      this.size.width / 2 + this.feetToPixels(RESTRICTED_AREA_WIDTH / 2),
      this.feetToPixels(BACKBOARD_DISTANCE_TO_BACKLINE)
    );

    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.strokeRect(
      this.size.width / 2 - this.feetToPixels(FREE_THROW_CIRCLE_RADIUS),
      0,
      this.feetToPixels(2 * FREE_THROW_CIRCLE_RADIUS),
      this.feetToPixels(PAINTED_AREA.length)
    );
    this.ctx.stroke();
  }

  private degToRad(deg: number) {
    return deg * (Math.PI / 180);
  }

  private onResize() {
    const devicePixelRatio = window.devicePixelRatio || 1;

    const width = this.container.clientWidth;

    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${width / COURT_ASPECT_RATIO}px`;
    this.canvas.width = width * devicePixelRatio;
    this.canvas.height = (width / COURT_ASPECT_RATIO) * devicePixelRatio;

    this.size = {
      width: width,
      height: width / COURT_ASPECT_RATIO,
      sectionSize: width / GRID_SIZE,
    };

    this.ctx.scale(devicePixelRatio, devicePixelRatio);
  }

  private bindEvents() {
    window.addEventListener(
      'resize',
      () => {
        this.onResize();
        this.draw();
      },
      { signal: this.abortController.signal }
    );
  }

  private feetToPixels(feet: number) {
    return feet * (this.size.width / COURT_WIDTH_FT);
  }
}

const getRgb = (color: string) => {
  const [r, g, b] = color
    .replace('rgb(', '')
    .replace(')', '')
    .split(',')
    .map((str) => Number(str));
  return {
    r,
    g,
    b,
  };
};

const colorInterpolate = (colorA: string, colorB: string, intval: number) => {
  const rgbA = getRgb(colorA);
  const rgbB = getRgb(colorB);

  const colorVal = (prop: 'r' | 'g' | 'b') =>
    Math.round(rgbA[prop] * (1 - intval) + rgbB[prop] * intval);

  return {
    r: colorVal('r'),
    g: colorVal('g'),
    b: colorVal('b'),
  };
};

const getAccuracyColor = (accuracy: number) => {
  return colorInterpolate('rgb(101, 146, 173)', 'rgb(2, 49, 77)', accuracy);
};
