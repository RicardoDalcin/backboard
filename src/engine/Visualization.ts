export type Shot = {
  // season: string;
  // teamId: string;
  // teamName: string;
  // playerId: string;
  // playerName: string;
  // positionGroup: string;
  // position: string;
  // gameDate: string;
  // gameId: string;
  // homeTeam: string;
  // awayTeam: string;
  // eventType: string;
  // shotMade: string;
  // actionType: string;
  // shotType: string;
  // zone: {
  //   basic: string;
  //   name: string;
  //   abbreviation: string;
  //   range: string;
  // };
  location: {
    x: number;
    y: number;
    // distance: number;
  };
  // time: {
  //   quarter: number;
  //   minsLeft: number;
  //   secsLeft: number;
  // };
};

const SHOTS: Shot[] = [
  {
    location: {
      x: -0,
      y: 5.95,
    },
  },
  {
    location: {
      x: -12.2,
      y: 21.75,
    },
  },
  {
    location: {
      x: -0,
      y: 7.05,
    },
  },
  {
    location: {
      x: -1,
      y: 29.65,
    },
  },
  {
    location: {
      x: -22.8,
      y: 6.35,
    },
  },
  {
    location: {
      x: 15.1,
      y: 25.25,
    },
  },
  {
    location: {
      x: 15,
      y: 24.75,
    },
  },
  {
    location: {
      x: 19.7,
      y: 21.65,
    },
  },
  {
    location: {
      x: -1.5,
      y: 4.75,
    },
  },
  {
    location: {
      x: -1.5,
      y: 4.65,
    },
  },
  {
    location: {
      x: 0.4,
      y: 5.45,
    },
  },
  {
    location: {
      x: -1.7,
      y: 5.15,
    },
  },
  {
    location: {
      x: -1.5,
      y: 5.45,
    },
  },
  {
    location: {
      x: -1.4,
      y: 5.15,
    },
  },
];

// All units are in feet

// 50mm (0.16 ft)
const LINE_WIDTH = 0.16;

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

export class VisualizationEngine {
  private ctx: CanvasRenderingContext2D;
  private size = { width: 0, height: 0 };
  private abortController = new AbortController();

  constructor(
    private canvas: HTMLCanvasElement,
    private container: HTMLDivElement
  ) {
    const ctx = this.canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Canvas context is not available");
    }

    this.ctx = ctx;

    this.onResize();
    this.bindEvents();

    this.draw();
  }

  destroy() {}

  private draw() {
    this.drawCourt();
    this.drawShots();
  }

  private drawShots() {
    SHOTS.forEach((shot) => {
      this.drawShot(shot);
    });

    // draw grid of 50 squares
    const gridSize = this.size.width / 50;
    for (let i = 0; i < 50; i++) {
      for (let j = 0; j < 50; j++) {
        this.ctx.save();
        this.ctx.globalAlpha = 0.1;
        this.ctx.strokeStyle = "#ffffff";
        this.ctx.strokeRect(gridSize * i, gridSize * j, gridSize, gridSize);
        this.ctx.stroke();
        this.ctx.restore();
      }
    }
  }

  // private lerp(
  //   startA: number,
  //   endA: number,
  //   startB: number,
  //   endB: number,
  //   t: number
  // ) {
  //   return startA + (endA - startA) * t;
  // }

  private drawShot(shot: Shot) {
    // 0 is the center of the court
    // -25 is the right side of the court
    // 25 is the left side of the court

    // y is the distance from baseline

    const x =
      this.size.width / 2 -
      (this.size.width / 2) * (Math.ceil(shot.location.x) / 25);

    const y = this.feetToPixels(Math.ceil(shot.location.y));

    const size = this.size.width / 50;

    this.ctx.fillStyle = "#ff00ff";
    this.ctx.fillRect(x, y, size, size);
  }

  private drawCourt() {
    this.ctx.clearRect(0, 0, this.size.width, this.size.height);
    this.ctx.fillStyle = "#242424";
    this.ctx.fillRect(0, 0, this.size.width, this.size.height);

    // Draw the court lines
    // Border
    const lineWidth = this.feetToPixels(LINE_WIDTH);
    this.ctx.lineWidth = lineWidth;
    this.ctx.strokeStyle = "#ffffff";
    this.ctx.strokeRect(
      lineWidth / 2,
      lineWidth / 2,
      this.size.width - lineWidth * 2,
      this.size.height - lineWidth * 2
    );

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
    this.ctx.fillStyle = "#ffffff";
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
    };

    this.ctx.scale(devicePixelRatio, devicePixelRatio);
  }

  private bindEvents() {
    window.addEventListener(
      "resize",
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
