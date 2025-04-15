export class VisualizationEngine {
  private ctx: CanvasRenderingContext2D;
  private size = { width: 0, height: 0 };
  private abortController = new AbortController();

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

  destroy() {}

  private draw() {
    this.ctx.clearRect(0, 0, this.size.width, this.size.height);
    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(0, 0, this.size.width, this.size.height);
  }

  private onResize() {
    const devicePixelRatio = window.devicePixelRatio || 1;

    const COURT_LENGTH_FT = 94 / 2;
    const COURT_WIDTH_FT = 50;

    const COURT_ASPECT_RATIO = COURT_LENGTH_FT / COURT_WIDTH_FT;

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
      'resize',
      () => {
        console.log('resize');
        this.onResize();
        this.draw();
      },
      { signal: this.abortController.signal }
    );
  }
}
