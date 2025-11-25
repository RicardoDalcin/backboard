import { BASIC_ZONES, SEASON_AVERAGES, ZONE_LOCATIONS } from '@nba-viz/data';

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

const THEME = {
  background: '#ffffff',
  line: '#808080',
  paintedArea: '#353535',
  hoveredShot: '#4f39f6',
};

interface ShotSection {
  // X and Y in the GRID_SIZExGRID_SIZE grid
  x: number;
  y: number;

  quantity: number;
  fieldGoalPercentage: number;

  totalMade: number;
  totalMissed: number;

  leagueAverage: number;
}

export type HighlightCallbackData = {
  totalShots: number;
  madeShots: number;
  section: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  };
  position: {
    x: number;
    y: number;
  };
};

export type HoverCallbackData = HighlightCallbackData | null;

const getDefaultHoveringData = (): HighlightCallbackData => {
  return {
    totalShots: 0,
    madeShots: 0,
    section: {
      startX: Infinity,
      startY: Infinity,
      endX: -Infinity,
      endY: -Infinity,
    },
    position: { x: 0, y: 0 },
  };
};

export interface EngineCallbacks {
  onHover: (data: HighlightCallbackData | null, passive?: boolean) => void;
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
  private isMouseOutside = false;
  private cachedVisualization: ImageData | null = null;
  private cachedZones = new Map<keyof typeof BASIC_ZONES, HTMLCanvasElement>();
  private seasonRange = {
    min: 0,
    max: 0,
  };

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

  setSeasonRange(min: number, max: number) {
    this.seasonRange = { min, max };
  }

  setShotData(
    shots: {
      locX: number;
      locY: number;
      totalShots: number;
      totalMade: number;
    }[],
    seasonRange: {
      min: number;
      max: number;
    },
  ) {
    this.shots.clear();
    this.seasonRange = seasonRange;

    const seasonAverages: Record<
      string,
      {
        totalShots: number;
        totalMade: number;
      }
    > = {};
    for (
      let season = this.seasonRange.min;
      season <= this.seasonRange.max;
      season++
    ) {
      const seasonKey = String(season) as keyof typeof SEASON_AVERAGES;
      const averages = SEASON_AVERAGES[seasonKey];

      for (const [key, value] of Object.entries(averages)) {
        const averageAtPosition = seasonAverages[key] ?? {
          totalShots: 0,
          totalMade: 0,
        };

        averageAtPosition.totalShots += value.totalShots;
        averageAtPosition.totalMade += value.totalMade;
        seasonAverages[key] = averageAtPosition;
      }
    }

    for (const shot of shots) {
      const key = this.getShotKey(shot.locX + 25, shot.locY);
      const seasonAverage = seasonAverages[`${shot.locX};${shot.locY}`];
      const fgPercentage =
        seasonAverage.totalShots > 0
          ? seasonAverage.totalMade / seasonAverage.totalShots
          : 0;
      this.shots.set(key, {
        x: shot.locX + 25,
        y: shot.locY,
        quantity: 0,
        fieldGoalPercentage: 0,
        totalMade: shot.totalMade,
        totalMissed: shot.totalShots - shot.totalMade,
        leagueAverage: fgPercentage,
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

    this.cachedVisualization = null;
    this.draw();
  }

  destroy() {
    this.abortController.abort();
  }

  private draw() {
    this.ctx.clearRect(0, 0, this.size.width, this.size.height);
    this.ctx.fillStyle = THEME.background;
    this.ctx.fillRect(0, 0, this.size.width, this.size.height);

    if (this.cachedVisualization) {
      this.ctx.putImageData(this.cachedVisualization, 0, 0);
    } else {
      this.drawCourt();
      this.ctx.save();
      this.drawShots();

      this.cachedVisualization = this.ctx.getImageData(
        0,
        0,
        this.canvas.width * devicePixelRatio,
        this.canvas.height * devicePixelRatio,
      );
    }

    this.drawHoveredShot();
  }

  private highlightedZone: keyof typeof BASIC_ZONES | null = null;

  public highlightZone(zone: keyof typeof BASIC_ZONES | null) {
    this.highlightedZone = zone;
    this.draw();

    if (!zone) {
      this.callbacks.onHover(null, true);
      return;
    }

    const shotZone = ZONE_LOCATIONS[zone];
    const aggregate: HighlightCallbackData = shotZone.reduce((acc, shot) => {
      const key = this.getShotKey(shot.x, shot.y);
      const shotData = this.shots.get(key);
      const position = this.sectionToPosition(shot.x, shot.y);

      return {
        totalShots: acc.totalShots + (shotData?.quantity ?? 0),
        madeShots: acc.madeShots + (shotData?.totalMade ?? 0),
        section: {
          startX: Math.min(acc.section.startX, shot.x),
          startY: Math.min(acc.section.startY, shot.y),
          endX: Math.max(acc.section.endX, shot.x),
          endY: Math.max(acc.section.endY, shot.y),
        },
        position: {
          x: Math.max(acc.position.x, position.x),
          y: Math.max(acc.position.y, position.y),
        },
      };
    }, getDefaultHoveringData());

    this.callbacks.onHover(aggregate, true);
  }

  private cacheZone(zone: keyof typeof BASIC_ZONES) {
    // Create offscreen canvas for this zone
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = this.size.width * devicePixelRatio;
    offscreenCanvas.height = this.size.height * devicePixelRatio;
    const offscreenCtx = offscreenCanvas.getContext('2d');

    if (!offscreenCtx) {
      return;
    }

    offscreenCtx.scale(devicePixelRatio, devicePixelRatio);

    const highlightedShots = ZONE_LOCATIONS[zone];

    // Create a set for quick lookup of highlighted shots
    const highlightedSet = new Set(
      highlightedShots.map((shot) => `${shot.x},${shot.y}`),
    );

    // Fill all highlighted shots as one shape
    offscreenCtx.beginPath();
    for (const shot of highlightedShots) {
      const { x, y } = this.sectionToPosition(shot.x, shot.y);
      offscreenCtx.rect(x, y, this.size.sectionSize, this.size.sectionSize);
    }
    offscreenCtx.globalAlpha = 0.2;
    offscreenCtx.fillStyle = THEME.hoveredShot;
    offscreenCtx.fill();

    // Draw strokes only on outer borders
    offscreenCtx.beginPath();
    for (const shot of highlightedShots) {
      const { x, y } = this.sectionToPosition(shot.x, shot.y);
      const size = this.size.sectionSize;

      // Top
      if (!highlightedSet.has(`${shot.x},${shot.y - 1}`)) {
        offscreenCtx.moveTo(x, y);
        offscreenCtx.lineTo(x + size, y);
      }
      // Right
      if (!highlightedSet.has(`${shot.x + 1},${shot.y}`)) {
        offscreenCtx.moveTo(x + size, y);
        offscreenCtx.lineTo(x + size, y + size);
      }
      // Bottom
      if (!highlightedSet.has(`${shot.x},${shot.y + 1}`)) {
        offscreenCtx.moveTo(x, y + size);
        offscreenCtx.lineTo(x + size, y + size);
      }
      // Left
      if (!highlightedSet.has(`${shot.x - 1},${shot.y}`)) {
        offscreenCtx.moveTo(x, y);
        offscreenCtx.lineTo(x, y + size);
      }
    }

    offscreenCtx.globalAlpha = 1;
    offscreenCtx.strokeStyle = THEME.hoveredShot;
    offscreenCtx.lineWidth = 2;
    offscreenCtx.stroke();

    this.cachedZones.set(zone, offscreenCanvas);
  }

  private drawHoveredShot() {
    if (
      this.highlightedZone === null &&
      (!this.startHighlightShot || !this.endHighlightShot)
    ) {
      return;
    }

    if (this.highlightedZone) {
      // Check if zone is cached, if not, cache it
      if (!this.cachedZones.has(this.highlightedZone)) {
        this.cacheZone(this.highlightedZone);
      }

      const cachedCanvas = this.cachedZones.get(this.highlightedZone);
      if (cachedCanvas) {
        this.ctx.save();
        this.ctx.drawImage(
          cachedCanvas,
          0,
          0,
          this.size.width,
          this.size.height,
        );
        this.ctx.restore();
      }
      return;
    }

    if (this.startHighlightShot && this.endHighlightShot) {
      const startSection = this.startHighlightShot.section;
      const endSection = this.endHighlightShot.section;
      const minX = Math.min(startSection.startX, endSection.endX);
      const maxX = Math.max(startSection.startX, endSection.endX);
      const minY = Math.min(startSection.startY, endSection.endY);
      const maxY = Math.max(startSection.startY, endSection.endY);

      this.ctx.strokeStyle = THEME.hoveredShot;
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(
        minX * this.size.sectionSize,
        minY * this.size.sectionSize,
        (maxX - minX + 1) * this.size.sectionSize,
        (maxY - minY + 1) * this.size.sectionSize,
      );
      this.ctx.stroke();
      this.ctx.restore();

      this.ctx.save();
      this.ctx.fillStyle = THEME.hoveredShot;
      this.ctx.globalAlpha = 0.2;
      this.ctx.fillRect(
        minX * this.size.sectionSize,
        minY * this.size.sectionSize,
        (maxX - minX + 1) * this.size.sectionSize,
        (maxY - minY + 1) * this.size.sectionSize,
      );
      this.ctx.fill();
      this.ctx.restore();
    }
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

    const color = getAccuracyColor(
      shot.fieldGoalPercentage,
      shot.leagueAverage,
    );
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

    for (const zone of Object.keys(BASIC_ZONES)) {
      this.cacheZone(zone as keyof typeof BASIC_ZONES);
    }
  }

  private clearHoveredShot({ passive }: { passive?: boolean } = {}) {
    this.startHighlightShot = null;
    this.endHighlightShot = null;
    this.callbacks.onHover(null, passive);
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
      currentHighlight.section.startX === x &&
      currentHighlight.section.startY === y &&
      currentHighlight.section.endX === x &&
      currentHighlight.section.endY === y
    ) {
      return;
    }

    const newShot = {
      totalShots: shot?.quantity ?? 0,
      madeShots: shot?.totalMade ?? 0,
      section: { startX: x, startY: y, endX: x, endY: y },
      position: { x: posX, y: posY },
    };

    if (!this.isMouseDown) {
      this.startHighlightShot = newShot;
      this.endHighlightShot = newShot;
    } else {
      this.endHighlightShot = newShot;
    }

    const aggregate = getDefaultHoveringData();

    if (!this.startHighlightShot || !this.endHighlightShot) {
      return;
    }

    const startSection = this.startHighlightShot.section;
    const endSection = this.endHighlightShot.section;

    const minX = Math.min(startSection.startX, endSection.endX);
    const maxX = Math.max(startSection.startX, endSection.endX);
    const minY = Math.min(startSection.startY, endSection.endY);
    const maxY = Math.max(startSection.startY, endSection.endY);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        const key = this.getShotKey(x, y);
        const shot = this.shots.get(key);

        if (shot) {
          const position = this.sectionToPosition(x, y);

          aggregate.totalShots += shot.quantity;
          aggregate.madeShots += shot.totalMade;
          aggregate.section = {
            startX: Math.min(aggregate.section.startX, x),
            startY: Math.min(aggregate.section.startY, y),
            endX: Math.max(aggregate.section.endX, x),
            endY: Math.max(aggregate.section.endY, y),
          };
          aggregate.position = {
            x: Math.max(aggregate.position.x, position.x),
            y: Math.max(aggregate.position.y, position.y),
          };
        }
      }
    }

    this.callbacks.onHover(aggregate, false);
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
      this.clearHoveredShot({ passive: true });
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
      section: { startX: startX, startY: startY, endX: startX, endY: startY },
      position: {
        x: startPosX,
        y: startPosY,
      },
    };

    const newEndShot = {
      totalShots: endShot?.quantity ?? 0,
      madeShots: endShot?.totalMade ?? 0,
      section: { startX: endX, startY: endY, endX: endX, endY: endY },
      position: {
        x: endPosX,
        y: endPosY,
      },
    };

    this.startHighlightShot = newStartShot;
    this.endHighlightShot = newEndShot;

    const aggregate = getDefaultHoveringData();

    const startSection = this.startHighlightShot.section;
    const endSection = this.endHighlightShot.section;

    const minX = Math.min(startSection.startX, endSection.startX);
    const maxX = Math.max(startSection.endX, endSection.endX);
    const minY = Math.min(startSection.startY, endSection.startY);
    const maxY = Math.max(startSection.endY, endSection.endY);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        const key = this.getShotKey(x, y);
        const shot = this.shots.get(key);

        if (shot) {
          aggregate.totalShots += shot.quantity;
          aggregate.madeShots += shot.totalMade;
          aggregate.section = {
            startX: Math.min(aggregate.section.startX, x),
            startY: Math.min(aggregate.section.startY, y),
            endX: Math.max(aggregate.section.endX, x),
            endY: Math.max(aggregate.section.endY, y),
          };

          const position = this.sectionToPosition(x, y);
          aggregate.position = {
            x: Math.max(aggregate.position.x, position.x),
            y: Math.max(aggregate.position.y, position.y),
          };
        }
      }
    }

    if (aggregate.totalShots > 0) {
      this.callbacks.onHover(aggregate, true);
    }
    this.draw();
  }

  private bindEvents() {
    const resizeObserver = new ResizeObserver(() => {
      this.onResize();
      this.cachedVisualization = null;
      this.cachedZones.clear();
      for (const zone of Object.keys(BASIC_ZONES)) {
        this.cacheZone(zone as keyof typeof BASIC_ZONES);
      }
      this.draw();
    });

    resizeObserver.observe(this.container);
    this.abortController.signal.addEventListener('abort', () => {
      resizeObserver.unobserve(this.container);
    });

    this.canvas.addEventListener('mousedown', () => {
      this.isMouseDown = true;
    });

    window.addEventListener(
      'mouseup',
      () => {
        if (!this.isMouseDown) {
          return;
        }

        this.isMouseDown = false;

        if (this.isMouseOutside || !this.endHighlightShot) {
          this.clearHoveredShot();
          return;
        }

        this.onHover({
          x: this.endHighlightShot.section.endX,
          y: this.endHighlightShot.section.endY,
        });
      },
      { signal: this.abortController.signal },
    );

    this.canvas.addEventListener(
      'mouseenter',
      () => {
        this.isMouseOutside = false;
      },
      { signal: this.abortController.signal },
    );

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
        this.isMouseOutside = true;

        if (this.isMouseDown) {
          return;
        }

        this.clearHoveredShot();
      },
      { signal: this.abortController.signal },
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

const rgbStringToObject = (color: string) => {
  const [r, g, b] = color
    .replace('rgb(', '')
    .replace(')', '')
    .split(',')
    .map((str) => Number(str));
  return { r, g, b };
};

// const SHOT_COLORS = {
//   base: 'rgb(249, 220, 150)',
//   goodStart: 'rgb(240, 130, 95)',
//   goodEnd: 'rgb(174, 42, 71)',
//   badStart: 'rgb(99, 137, 186)',
//   badEnd: 'rgb(101, 146, 173)',
// };

export const SHOT_COLORS = {
  base: 'rgb(69, 107, 130)',
  goodStart: 'rgb(48, 82, 102)',
  goodEnd: 'rgb(28, 54, 69)',
  badStart: 'rgb(96, 135, 158)',
  badEnd: 'rgb(137, 176, 199)',
};

const getAccuracyColor = (accuracy: number, average?: number) => {
  if (average == undefined) {
    return rgbStringToObject(SHOT_COLORS.base);
  }

  const tolerance = 0.01;

  if (Math.abs(accuracy - average) <= tolerance) {
    return rgbStringToObject(SHOT_COLORS.base);
  }

  // Lerp difference from diffStart% to diffMax%. Any different greater than diffMax% is lerped to 100% difference
  const distanceFromAverage = Math.abs(accuracy - average);
  const lerpAmount = Math.min(distanceFromAverage / 0.1, 1);

  const colorLerp =
    accuracy > average
      ? {
          start: SHOT_COLORS.goodStart,
          end: SHOT_COLORS.goodEnd,
        }
      : {
          start: SHOT_COLORS.badStart,
          end: SHOT_COLORS.badEnd,
        };
  return colorInterpolate(colorLerp.start, colorLerp.end, lerpAmount);
};
