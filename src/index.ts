import * as d3 from 'd3';
import { Observable, interval, fromEvent, animationFrameScheduler, from, merge } from "rxjs";
import { last, map, mergeMap, publishLast, startWith, takeUntil, tap, throttleTime, withLatestFrom, distinctUntilChanged } from 'rxjs/operators';
import { inferenceRecord, ANN, ANNExec, argmax } from './ann';
import net from './net.json';
import { FCNN } from './FCNN.js';

const SIZE = 28;
const PIXEL_SIZE = 10;
const GAP_SIZE = 1;

type Table = Array<number>;
type Color = number;
interface MousePos { x: number, y: number };
interface MouseIdx { i: number, j: number };
interface Canvas {
    grd: any,
    ctx: CanvasRenderingContext2D,
    rows: number,
    cols: number
    pixSize: number,
    gapSize: number
};

function initTable(size:number): Table {
    // creates a nxn array
    const arr: Array<number> = new Array(size*size);
    for (let k = 0; k < SIZE*SIZE; k++) {
        arr[k] = 0;
    }
    return arr;
}

function drawPixel(
    g: Canvas, table: Table, i: number, j: number
) {
    let k = i*g.cols + j;
    let x = g.gapSize + (g.pixSize + g.gapSize) * i;
    let y = g.gapSize + (g.pixSize + g.gapSize) * j;
    g.ctx.clearRect(x, y, g.pixSize, g.pixSize);
    g.ctx.fillRect(x, y, g.pixSize, g.pixSize);
    g.ctx.fillStyle = table[k] === 1 ? '#FFF' : '#000';
    g.ctx.fill();
    g.ctx.closePath();
}

async function updatePixel(
    g: Canvas, table: Table, i: number, j: number, value: number
) {
    let k = i*g.cols + j;
    table[k] = value;
    let x = g.gapSize + (g.pixSize + g.gapSize) * i;
    let y = g.gapSize + (g.pixSize + g.gapSize) * j;
    g.ctx.clearRect(x, y, g.pixSize, g.pixSize);
    g.ctx.fillRect(x, y, g.pixSize, g.pixSize);
    g.ctx.fillStyle = value === 1 ? '#FFF' : '#000';
    g.ctx.fill();
    g.ctx.closePath();
}

function getColor(svg: HTMLElement, table: Table, e: MouseEvent) {
    const z = getIndex(getMouse(svg, e));
    return table[z.i*SIZE + z.j]
}

function getMouse(svg:HTMLElement, e: MouseEvent): MousePos {
    return {
        x: e.pageX - svg.getBoundingClientRect().left,
        y: e.pageY - svg.getBoundingClientRect().top
    }
}

function getIndex(pos: MousePos): MouseIdx {
    return {
        i: Math.floor(pos.x / (PIXEL_SIZE + GAP_SIZE)),
        j: Math.floor(pos.y / (PIXEL_SIZE + GAP_SIZE)),
    }
}

function saveFile(table: Table, filename: string) {
    console.log('called saveFile');
    
    let s = '';
    for (let i = 0; i < SIZE; i++) {
        for (let j = 0; j < SIZE; j++) {
            s += table[i*SIZE + j];
        }
        s += '\n'
    }
    var myBlob = new Blob([s], {type: 'text/plain'});

    // (B) CREATE DOWNLOAD LINK
    var url = window.URL.createObjectURL(myBlob);
    var anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;

    anchor.click();
    window.URL.revokeObjectURL(url);
    document.removeChild(anchor);
}

// create canvas
function createCanvas(
    rows: number,
    cols: number,
    pixSize: number,
    gapSize: number,
    table: Table
): Canvas {
    let grd = document.createElement('canvas');
    grd.setAttribute('width', '' + (gapSize + (pixSize + gapSize) * cols) + '');
    grd.setAttribute('height', '' + (gapSize + (pixSize + gapSize) * rows) + '');
    document.getElementById('canvas')!.appendChild(grd);
    let ctx = grd.getContext('2d')!;
    // initialise pixels
    let g = {
        grd: grd,
        ctx: ctx,
        rows: rows,
        cols: cols,
        pixSize: pixSize,
        gapSize: gapSize
    };
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            drawPixel(g, table, i, j);
        }
    }
    return g;
}

/**
* Update table of outputs
**/
function updateOutputTable(outputArray: Array<number>) {
    for (let i = 0; i < outputArray.length; i++) {
        document.getElementById('val_' + i)!.textContent = ('' + outputArray[i]).slice(0, 6);
    }
    document.getElementById('val_pred')!.textContent = '' + argmax(outputArray);
}

// create internal and external pixel array
const arr = initTable(SIZE);

var grid = createCanvas(SIZE, SIZE, PIXEL_SIZE, GAP_SIZE, arr);
//var array = createCanvas(1, SIZE*SIZE, PIXEL_SIZE/5, GAP_SIZE/5, arr);

// create button to save file
const button = document.getElementById('button')!;
button.addEventListener('click', (_) => saveFile(arr, 'test.txt'));

// TODO: create button to start fresh

// create the Observable streams
const mouseDown$: Observable<Event> = fromEvent(document, 'mousedown');
const mouseUp$: Observable<Event> = fromEvent(document, 'mouseup');
const mouseMove$: Observable<Event> = fromEvent(document, 'mousemove');

mouseDown$.pipe(
    mergeMap(md => {
        const _md = md as MouseEvent;
        const c: Color = (getColor(grid.grd, arr, _md) + 1) % 2;
        return mouseMove$.pipe(
            startWith(md),
            map(move => {
                const _e = move as MouseEvent;
                return { ...getIndex(getMouse(grid.grd, _e)), value: c };
            }),
            distinctUntilChanged(),
            takeUntil(mouseUp$),
        )
    }),
).subscribe(({i, j, value}) => updatePixel(grid, arr, i, j, value));

// Generate SVG
var fcnn = FCNN();
function restart(netExec: ANNExec | undefined) {

    let architecture = [SIZE*SIZE, 16, 16, 10];

    let betweenNodesInLayer = [20, 20, 20, 20];

    fcnn.redraw({
        'architecture_':architecture,
        'showBias_': false,
        'showLabels_': true,
        'annexec_': netExec
    });
    fcnn.redistribute({'betweenNodesInLayer_':betweenNodesInLayer});

}

let annRec: ANNExec = inferenceRecord(net, arr);
let output = annRec.stages[annRec.nLayers];
restart(annRec);
updateOutputTable(output);
mouseUp$.subscribe((_) => {
    const annRec = inferenceRecord(net, arr);
    restart(annRec);
    const output = annRec.stages[annRec.nLayers];
    updateOutputTable(output);
});
