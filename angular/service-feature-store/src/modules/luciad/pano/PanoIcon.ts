export interface PanoIconOptions {
    stroke: string;
    fill: string;
    strokeWidth: number;
    width: number;
    height: number;
    fading?: string;
    type?:string;
    invert?: boolean;
    border?: boolean;
    offsetX?: number;
    offsetY?: number;
    fontSize?: string
    font?: string;
    textColor?: string;
    textAlign?: CanvasTextAlign;
    speed?: number;
}

const DEFAULT_WIDTH = 64,
    DEFAULT_HEIGHT = 64,
    DEFAULT_STROKESTYLE = "rgba(155,167,23,1)",
    DEFAULT_FILLSTYLE = "rgba(155,167,23,1)",
    DEFAULT_STROKEWIDTH = 1;

export function PanoIcon (options: PanoIconOptions) {
    const ct = MakeContext(options.stroke, options.fill, options.strokeWidth, options.width, options.height),
        canvas = ct.canvas,
        context = ct.context;

    const offset = (options.strokeWidth || DEFAULT_STROKEWIDTH),
        center = canvas.width / 2;

    // offset = 0;  // No stroke

    let radius = (center - (offset));
    if (radius <= 0) {
        radius = 1;
    }

    if (context) {
        context.beginPath()
        context.arc(center, center, radius*0.75, 0, Math.PI * 2, false);
        context.arc(center, center, radius*0.35 , 0, Math.PI * 2, true);
        context.fill();

        context.beginPath()
        context.arc(center, center, radius, 0, Math.PI * 2, false);
        context.arc(center, center, radius*0.95, 0, Math.PI * 2, true);
        context.fill();
    }

    return canvas;
}

function MakeContext(stroke:string, fill:string, strokeWidth: number, width: number, height: number) {

    const canvas = document.createElement("canvas"),
        context = canvas.getContext("2d");

    canvas.width = width || DEFAULT_WIDTH;
    canvas.height = height || DEFAULT_HEIGHT;

    if (context) {
        context.strokeStyle = stroke || DEFAULT_STROKESTYLE;
        context.fillStyle = fill || DEFAULT_FILLSTYLE;
        context.lineWidth = strokeWidth || DEFAULT_STROKEWIDTH;
    }

    return {canvas, context};
}
