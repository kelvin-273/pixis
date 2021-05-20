import * as d3 from 'd3';
import { Observable, interval, fromEvent, animationFrameScheduler, from, merge } from "rxjs";
import { last, map, filter, mergeMap, publishLast, startWith, takeUntil, tap, throttleTime, withLatestFrom, distinctUntilChanged } from 'rxjs/operators';
import { inferenceRecord, ANN, ANNExec, argmax } from './ann';
import net from './net.json';
import { FCNN } from './FCNN.js';
//import { loadFile_aux } from './loadFile.js';

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
    for (let k = 0; k < size*size; k++) {
        arr[k] = 0;
    }
    return arr;
}

function drawPixel(
    g: Canvas, table: Table, i: number, j: number
) {
    let k = i*g.cols + j;
    let x = g.gapSize + (g.pixSize + g.gapSize) * j;
    let y = g.gapSize + (g.pixSize + g.gapSize) * i;
    g.ctx.clearRect(x, y, g.pixSize, g.pixSize);
    g.ctx.fillStyle = table[k] === 1 ? '#000' : '#FFF';
    g.ctx.fillRect(x, y, g.pixSize, g.pixSize);
    g.ctx.fill();
    g.ctx.closePath();
}

async function updatePixel(
    g: Canvas, table: Table, i: number, j: number, value: number
) {
    let k = i*g.cols + j;
    table[k] = value;
    let x = g.gapSize + (g.pixSize + g.gapSize) * j;
    let y = g.gapSize + (g.pixSize + g.gapSize) * i;
    g.ctx.clearRect(x, y, g.pixSize, g.pixSize);
    g.ctx.fillStyle = value === 1 ? '#000' : '#FFF';
    g.ctx.fillRect(x, y, g.pixSize, g.pixSize);
    g.ctx.fill();
    g.ctx.closePath();
}

function getColor(svg: HTMLElement, table: Table, e: MouseEvent) {
    const z = getIndex(getMouse(svg, e));
    return table[z.i*SIZE + z.j]
}

function getMouse(svg:HTMLElement, e: MouseEvent): MousePos {
    return {
        x: e.clientX - svg.getBoundingClientRect().left,
        y: e.clientY - svg.getBoundingClientRect().top
    }
}

function getIndex(pos: MousePos): MouseIdx {
    return {
        i: Math.floor(pos.y / (PIXEL_SIZE + GAP_SIZE)),
        j: Math.floor(pos.x / (PIXEL_SIZE + GAP_SIZE)),
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

function loadFileBodge(table: Table) {
    let xs = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (let k = 0; k < xs.length; k++) {
        table[k] = xs[k];
    }
    return table
}

function refresh(g: Canvas, table: Table) {
    for (let i = 0; i < SIZE; i++) {
        for (let j = 0; j < SIZE; j++) {
            updatePixel(g, table, i, j, 0)
        }
    }
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
loadFileBodge(arr);

var grid = createCanvas(SIZE, SIZE, PIXEL_SIZE, GAP_SIZE, arr);

// create the Observable streams
const mouseDown$: Observable<Event> = fromEvent(document, 'mousedown');
const mouseUp$: Observable<Event> = fromEvent(document, 'mouseup');
const mouseMove$: Observable<Event> = fromEvent(document, 'mousemove');

mouseMove$.pipe(
    map(move => {
        const _e = move as MouseEvent;
        const {i, j} = getIndex(getMouse(grid.grd, _e));
        return {row: i, col: j, pix: SIZE*i + j};
    }),
    filter(({row, col, pix}) => 0 <= row && row < SIZE && 0 <= col && col < SIZE),
    distinctUntilChanged(),
).subscribe(({row, col, pix}) => {
    document.getElementById("mouse-row")!.textContent = row.toString();
    document.getElementById("mouse-col")!.textContent = col.toString();
    document.getElementById("mouse-pix")!.textContent = pix.toString();
});

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
            filter(({value, i, j}) => 0 <= i && i < SIZE && 0 <= j && j < SIZE),
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

// create button to save file
const saveFileButton = document.getElementById('saveFile')!;
saveFileButton.addEventListener('click', (_) => saveFile(arr, 'image.txt'));

// // create button to load file
// const loadFileButton = document.getElementById('loadFile')!;
// loadFileButton.addEventListener('change', (event) => {
//     // the loading
//     loadFile_aux(event, grid, arr);
//     
//     // render output
//     annRec = inferenceRecord(net, arr);
//     restart(annRec);
//     output = annRec.stages[annRec.nLayers];
//     updateOutputTable(output);
// });

// create button to refresh the state
const refreshButton = document.getElementById('refresh')!;
refreshButton.addEventListener('click', (_) => {
    // clean the image
    for (let i = 0; i < SIZE; i++) {
        for (let j = 0; j < SIZE; j++) {
            updatePixel(grid, arr, i, j, 0);
        }
    }
    // render output
    annRec = inferenceRecord(net, arr);
    restart(annRec);
    output = annRec.stages[annRec.nLayers];
    updateOutputTable(output);
});

// // Check for the various File API support.
// if (window.File && window.FileReader && window.FileList && window.Blob) {
//   // Great success! All the File APIs are supported.
// } else {
//   alert('The File APIs are not fully supported in this browser.');
// }
