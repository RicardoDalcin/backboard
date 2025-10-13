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
  line: '#808080',
  paintedArea: '#353535',
  hoveredShot: '#61d0ff',
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

export type HighlightCallbackData = {
  totalShots: number;
  madeShots: number;
  section: {
    x: number;
    y: number;
  };
  position: {
    x: number;
    y: number;
  };
};

export type HoverCallbackData = HighlightCallbackData[] | null;

export interface EngineCallbacks {
  onHover: (data: HighlightCallbackData[] | null) => void;
}

export class VisualizationEngine {
  private ctx: CanvasRenderingContext2D;
  private size = { width: 0, height: 0, sectionSize: 0 };
  private abortController = new AbortController();
  private shots = new Map<number, ShotSection>();

  private mostShots = 0;

  private startHighlightShot: HighlightCallbackData | null = null;
  private endHighlightShot: HighlightCallbackData | null = null;
  private isMouseDown = false;

  constructor(
    private canvas: HTMLCanvasElement,
    private container: HTMLDivElement,
    private callbacks: EngineCallbacks,
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

  setShotData(
    shots: {
      locX: number;
      locY: number;
      totalShots: number;
      totalMade: number;
    }[],
  ) {
    this.shots.clear();

    for (const shot of shots) {
      const key = this.getShotKey(shot.locX + 25, shot.locY);
      this.shots.set(key, {
        x: shot.locX + 25,
        y: shot.locY,
        quantity: 0,
        fieldGoalPercentage: 0,
        totalMade: shot.totalMade,
        totalMissed: shot.totalShots - shot.totalMade,
      });
    }

    this.mostShots = 0;

    this.shots.forEach((section) => {
      section.quantity = section.totalMade + section.totalMissed;
      section.fieldGoalPercentage = section.totalMade / section.quantity;

      if (section.quantity > this.mostShots) {
        this.mostShots = section.quantity;
      }
    });

    this.draw();
  }

  destroy() {
    this.abortController.abort();
  }

  private draw() {
    this.drawCourt();

    // Add Gaussian blur here
    // this.ctx.save();
    // this.ctx.filter = 'blur(2px)'; // Adjust the pixel value to control the blur amount
    this.ctx.save();
    this.drawShots();
    this.drawHoveredShot();
  }

  private drawHoveredShot() {
    if (!this.startHighlightShot || !this.endHighlightShot) {
      return;
    }

    const { x: startX, y: startY } = this.sectionToPosition(
      this.startHighlightShot.section.x,
      this.startHighlightShot.section.y,
    );

    const { x, y } = this.sectionToPosition(
      this.endHighlightShot.section.x,
      this.endHighlightShot.section.y,
    );

    const endX = x + this.size.sectionSize;
    const endY = y + this.size.sectionSize;

    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);

    const minX = Math.min(startX, endX);
    const minY = Math.min(startY, endY);

    this.ctx.strokeStyle = THEME.hoveredShot;
    this.ctx.beginPath();
    this.ctx.rect(minX, minY, width, height);
    this.ctx.closePath();
    this.ctx.stroke();
    this.ctx.fillStyle = THEME.hoveredShot;
    this.ctx.save();
    this.ctx.globalAlpha = 0.2;
    this.ctx.fillRect(minX, minY, width, height);
    this.ctx.restore();
  }

  private positionToSection(x: number, y: number) {
    const centerLeft = this.size.width / 2 - this.size.sectionSize * 2;
    const centerRight = this.size.width / 2 + this.size.sectionSize * 2;

    const xSection =
      x < centerLeft
        ? Math.floor(x / this.size.sectionSize)
        : x > centerRight
          ? Math.floor(x / this.size.sectionSize)
          : Math.round(x / this.size.sectionSize);

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
          this.size.sectionSize,
        );
        this.ctx.stroke();
        this.ctx.restore();
      }
    }
  }

  private drawShot(shot: ShotSection) {
    const shots =
      shot.quantity * Math.min(Math.max(1, 10 - shot.quantity / 1_000), 1);
    const mostShots =
      this.mostShots * Math.min(Math.max(1, 10 - this.mostShots / 1_000), 1);

    const size = Math.max(
      this.size.sectionSize *
        (Math.log10(shots + 1) / Math.log10(mostShots + 1)) *
        1.5,
      this.size.sectionSize * 0,
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
      size * 0.1,
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

    // this.ctx.save();
    // this.ctx.lineWidth = lineWidth * 2;
    // this.ctx.roundRect(0, 0, this.size.width, this.size.height, 12);
    // this.ctx.stroke();
    // this.ctx.restore();

    // Three-point line (two straight lines and one arc)
    this.ctx.beginPath();
    this.ctx.moveTo(this.feetToPixels(THREE_POINT_LINE_DISTANCE), 0);

    this.ctx.lineTo(
      this.feetToPixels(THREE_POINT_LINE_DISTANCE),
      this.feetToPixels(THREE_POINT_LINE_STRAIGHT_LENGTH),
    );

    this.ctx.arc(
      this.size.width / 2,
      this.feetToPixels(BASKET_DISTANCE_TO_BACKLINE),
      this.feetToPixels(THREE_POINT_LINE_RADIUS),
      this.degToRad(180 - 22.5),
      this.degToRad(360 + 22),
      true,
    );

    this.ctx.lineTo(
      this.size.width - this.feetToPixels(THREE_POINT_LINE_DISTANCE),
      0,
    );

    this.ctx.stroke();

    this.ctx.beginPath();
    const backboardWidth = this.feetToPixels(BACKBOARD_WIDTH);
    const backboardDistanceToBackline = this.feetToPixels(
      BACKBOARD_DISTANCE_TO_BACKLINE,
    );

    // Backboard
    this.ctx.moveTo(
      this.size.width / 2 - backboardWidth / 2,
      backboardDistanceToBackline,
    );
    this.ctx.lineTo(
      this.size.width / 2 + backboardWidth / 2,
      backboardDistanceToBackline,
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
      this.feetToPixels(PAINTED_AREA.length),
    );
    this.ctx.restore();
    this.ctx.strokeRect(
      this.size.width / 2 - this.feetToPixels(PAINTED_AREA.width) / 2,
      0,
      this.feetToPixels(PAINTED_AREA.width),
      this.feetToPixels(PAINTED_AREA.length),
    );
    this.ctx.stroke();

    const basketRadius = this.feetToPixels(BASKET_RADIUS);

    this.ctx.beginPath();
    this.ctx.moveTo(
      this.size.width / 2,
      this.feetToPixels(BACKBOARD_DISTANCE_TO_BACKLINE),
    );
    this.ctx.lineTo(
      this.size.width / 2,
      this.feetToPixels(BASKET_DISTANCE_TO_BACKLINE) - basketRadius,
    );

    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.arc(
      this.size.width / 2,
      this.feetToPixels(BASKET_DISTANCE_TO_BACKLINE),
      basketRadius,
      0,
      2 * Math.PI,
    );
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.arc(
      this.size.width / 2,
      this.feetToPixels(PAINTED_AREA.length),
      this.feetToPixels(FREE_THROW_CIRCLE_RADIUS),
      this.degToRad(0),
      this.degToRad(180),
    );
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.arc(
      this.size.width / 2,
      this.feetToPixels(PAINTED_AREA.length),
      this.feetToPixels(FREE_THROW_CIRCLE_RADIUS),
      this.degToRad(180),
      this.degToRad(360),
    );
    this.ctx.setLineDash([10, 10]);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    this.ctx.beginPath();
    this.ctx.moveTo(
      this.size.width / 2 - this.feetToPixels(RESTRICTED_AREA_WIDTH / 2),
      this.feetToPixels(BACKBOARD_DISTANCE_TO_BACKLINE),
    );

    this.ctx.lineTo(
      this.size.width / 2 - this.feetToPixels(RESTRICTED_AREA_WIDTH / 2),
      this.feetToPixels(BACKBOARD_DISTANCE_TO_BACKLINE) +
        this.feetToPixels(RESTRICTED_LINE_LENGTH),
    );

    this.ctx.arc(
      this.size.width / 2,
      this.feetToPixels(BASKET_DISTANCE_TO_BACKLINE),
      this.feetToPixels(RESTRICTED_CIRCLE_RADIUS),
      this.degToRad(180),
      this.degToRad(360),
      true,
    );

    this.ctx.lineTo(
      this.size.width / 2 + this.feetToPixels(RESTRICTED_AREA_WIDTH / 2),
      this.feetToPixels(BACKBOARD_DISTANCE_TO_BACKLINE),
    );

    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.strokeRect(
      this.size.width / 2 - this.feetToPixels(FREE_THROW_CIRCLE_RADIUS),
      0,
      this.feetToPixels(2 * FREE_THROW_CIRCLE_RADIUS),
      this.feetToPixels(PAINTED_AREA.length),
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

  private clearHoveredShot() {
    this.startHighlightShot = null;
    this.endHighlightShot = null;
    this.callbacks.onHover(null);
    this.draw();
  }

  private onHover({ x, y }: { x: number; y: number }) {
    const currentHighlight = this.isMouseDown
      ? this.endHighlightShot
      : this.startHighlightShot;

    const key = this.getShotKey(x, y);
    const shot = this.shots.get(key);

    const { x: posX, y: posY } = this.sectionToPosition(x, y);

    if (
      currentHighlight &&
      currentHighlight.section.x === x &&
      currentHighlight.section.y === y
    ) {
      return;
    }

    const newShot = {
      totalShots: shot?.quantity ?? 0,
      madeShots: shot?.totalMade ?? 0,
      section: { x, y },
      position: { x: posX, y: posY },
    };

    if (!this.isMouseDown) {
      this.startHighlightShot = newShot;
      this.endHighlightShot = newShot;
    } else {
      this.endHighlightShot = newShot;
    }

    const shots: HighlightCallbackData[] = [];

    if (!this.startHighlightShot || !this.endHighlightShot) {
      return;
    }

    const startSection = this.startHighlightShot.section;
    const endSection = this.endHighlightShot.section;

    const minX = Math.min(startSection.x, endSection.x);
    const maxX = Math.max(startSection.x, endSection.x);
    const minY = Math.min(startSection.y, endSection.y);
    const maxY = Math.max(startSection.y, endSection.y);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        const key = this.getShotKey(x, y);
        const shot = this.shots.get(key);

        if (shot) {
          shots.push({
            totalShots: shot.quantity,
            madeShots: shot.totalMade,
            section: { x, y },
            position: this.sectionToPosition(x, y),
          });
        }
      }
    }

    this.callbacks.onHover(shots);
    this.draw();
  }

  setHoveredShot(
    hoveredShot: {
      startX: number;
      startY: number;
      endX: number;
      endY: number;
    } | null,
  ) {
    if (hoveredShot == null) {
      this.clearHoveredShot();
      return;
    }

    const { startX, startY, endX, endY } = hoveredShot;

    const startKey = this.getShotKey(startX, startY);
    const startShot = this.shots.get(startKey);

    const endKey = this.getShotKey(endX, endY);
    const endShot = this.shots.get(endKey);

    const { x: startPosX, y: startPosY } = this.sectionToPosition(
      startX,
      startY,
    );
    const { x: endPosX, y: endPosY } = this.sectionToPosition(endX, endY);

    const newStartShot = {
      totalShots: startShot?.quantity ?? 0,
      madeShots: startShot?.totalMade ?? 0,
      section: { x: startX, y: startY },
      position: { x: startPosX, y: startPosY },
    };

    const newEndShot = {
      totalShots: endShot?.quantity ?? 0,
      madeShots: endShot?.totalMade ?? 0,
      section: { x: endX, y: endY },
      position: { x: endPosX, y: endPosY },
    };

    this.startHighlightShot = newStartShot;
    this.endHighlightShot = newEndShot;

    const shots: HighlightCallbackData[] = [];

    const startSection = newStartShot.section;
    const endSection = newEndShot.section;

    for (let x = startSection.x; x <= endSection.x; x++) {
      for (let y = startSection.y; y <= endSection.y; y++) {
        const key = this.getShotKey(x, y);
        const shot = this.shots.get(key);

        if (shot) {
          shots.push({
            totalShots: shot.quantity,
            madeShots: shot.totalMade,
            section: { x, y },
            position: this.sectionToPosition(x, y),
          });
        }
      }
    }

    if (shots.length > 0) {
      this.callbacks.onHover(shots);
    }
    this.draw();
  }

  private bindEvents() {
    const resizeObserver = new ResizeObserver(() => {
      this.onResize();
      this.draw();
    });

    resizeObserver.observe(this.container);
    this.abortController.signal.addEventListener('abort', () => {
      resizeObserver.unobserve(this.container);
    });

    this.canvas.addEventListener('mousedown', () => {
      this.isMouseDown = true;
    });

    this.canvas.addEventListener('mouseup', () => {
      this.startHighlightShot = this.endHighlightShot;
      this.isMouseDown = false;
      this.draw();
    });

    this.canvas.addEventListener(
      'mousemove',
      (event) => {
        const { x, y } = this.positionToSection(event.offsetX, event.offsetY);
        this.onHover({ x, y });
      },
      { signal: this.abortController.signal },
    );

    this.canvas.addEventListener(
      'mouseleave',
      () => {
        this.clearHoveredShot();
      },
      { signal: this.abortController.signal },
    );
  }

  private feetToPixels(feet: number) {
    return feet * (this.size.width / COURT_WIDTH_FT);
  }

  // private isThreePointer(sectionX: number, sectionY: number) {
  //   const { x, y } = this.sectionToPosition(sectionX, sectionY);
  //   const courtMiddle = this.size.width / 2;

  //   const courtInfoInPixels = {
  //     straightLength: this.feetToPixels(THREE_POINT_LINE_STRAIGHT_LENGTH),
  //     radius: this.feetToPixels(THREE_POINT_LINE_RADIUS + 1.1),
  //     distanceToSideline: this.feetToPixels(THREE_POINT_LINE_DISTANCE),
  //     distanceToBackline: this.feetToPixels(BACKBOARD_DISTANCE_TO_BACKLINE),
  //   };

  //   const posX = x + this.size.sectionSize / 2;
  //   const posY = y + this.size.sectionSize / 2;

  //   const isInStraight =
  //     y < courtInfoInPixels.straightLength + this.size.sectionSize;

  //   if (isInStraight) {
  //     return (
  //       x + this.size.sectionSize <= courtInfoInPixels.distanceToSideline ||
  //       x >= this.size.width - courtInfoInPixels.distanceToSideline
  //     );
  //   }

  //   const isInMiddleFew =
  //     posX >= courtMiddle - this.size.sectionSize * 6 &&
  //     posX <= courtMiddle + this.size.sectionSize * 6;

  //   if (isInMiddleFew) {
  //     return (
  //       y > courtInfoInPixels.radius + courtInfoInPixels.distanceToBackline
  //     );
  //   }

  //   return (
  //     Math.sqrt(
  //       Math.pow(posX - this.size.width / 2, 2) +
  //         Math.pow(posY - courtInfoInPixels.distanceToBackline, 2),
  //     ) > courtInfoInPixels.radius
  //   );
  // }
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

  // Adjust the interval to fit the new lightness range where 60% is darkest and 25% is lightest
  const adjustedIntval = (intval - 0.25) / (0.6 - 0.25);
  const clampedIntval = Math.max(0, Math.min(1, adjustedIntval)); // Ensure the interval is within bounds

  const colorVal = (prop: 'r' | 'g' | 'b') =>
    Math.round(rgbA[prop] * (1 - clampedIntval) + rgbB[prop] * clampedIntval);

  return {
    r: colorVal('r'),
    g: colorVal('g'),
    b: colorVal('b'),
  };
};

const getAccuracyColor = (accuracy: number) => {
  return colorInterpolate('rgb(101, 146, 173)', 'rgb(0, 20, 30)', accuracy);
};
