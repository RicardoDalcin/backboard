// All units are in feet

// 50mm (0.16 ft)
const LINE_WIDTH = 0.16;

// Distance between sideline and three-point line
const THREE_POINT_LINE_DISTANCE = 3;

// Radius of the three-point line from the basket
const THREE_POINT_LINE_RADIUS = 23.75;

const BACKBOARD_DISTANCE_TO_BACKLINE = 4;
const BASKET_DISTANCE_TO_BACKLINE = 5.25;

const COURT_LENGTH_FT = 94 / 2;
const COURT_WIDTH_FT = 50;

const COURT_ASPECT_RATIO = COURT_LENGTH_FT / COURT_WIDTH_FT;

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

    console.log(this.size);

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
    return feet * (this.size.width / COURT_LENGTH_FT);
  }
}
