import { Observable, interval, fromEvent, animationFrameScheduler, from, merge } from "rxjs";
import { last, map, mergeMap, publishLast, takeUntil, tap, withLatestFrom } from 'rxjs/operators';

const SIZE = 28;
const PIXEL_SIZE = 10;
const GAP_SIZE = 1;

type Table = Array<Array<number>>;
type Color = number;
interface MousePos {x: number, y: number};
interface MouseIdx {i: number, j: number};

function initTable(size:number): Table {
    // creates a nxn array
    const arr: Array<Array<number>> = new Array(size);
    for (let i = 0; i < arr.length; i++) {
        arr[i] = new Array(size);
        for (let j = 0; j < arr[i].length; j++) {
            arr[i][j] = 0;
        }
    }
    return arr;
}

function drawPixel(
    ctx: CanvasRenderingContext2D, table: Table, i: number, j: number
) {
    let x = GAP_SIZE + (PIXEL_SIZE + GAP_SIZE) * i;
    let y = GAP_SIZE + (PIXEL_SIZE + GAP_SIZE) * j;
    ctx.clearRect(x, y, PIXEL_SIZE, PIXEL_SIZE);
    ctx.fillRect(x, y, PIXEL_SIZE, PIXEL_SIZE);
    ctx.fillStyle = table[i][j] === 1 ? '#FFF' : '#000';
    ctx.fill();
    ctx.closePath();
}

function updatePixel(
    ctx: CanvasRenderingContext2D, table: Table, i: number, j: number, value: number
) {
    table[i][j] = value;
    let x = GAP_SIZE + (PIXEL_SIZE + GAP_SIZE) * i;
    let y = GAP_SIZE + (PIXEL_SIZE + GAP_SIZE) * j;
    ctx.clearRect(x, y, PIXEL_SIZE, PIXEL_SIZE);
    ctx.fillRect(x, y, PIXEL_SIZE, PIXEL_SIZE);
    ctx.fillStyle = value === 1 ? '#FFF' : '#000';
    ctx.fill();
    ctx.closePath();
}

function getColor(svg: HTMLElement, table: Table, e: MouseEvent) {
    const z = getIndex(getMouse(svg, e));
    return table[z.i][z.j]
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
    for (let i = 0; i < table.length; i++) {
        for (let j = 0; j < table.length; j++) {
            s += table[i][j];
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
var svg = document.createElement('canvas');
svg.setAttribute('width', '' + (GAP_SIZE + (PIXEL_SIZE + GAP_SIZE) * SIZE) + '');
svg.setAttribute('height', '' + (GAP_SIZE + (PIXEL_SIZE + GAP_SIZE) * SIZE) + '');
document.getElementById('canvas')!.appendChild(svg);
var ctx = svg.getContext('2d')!;

// create internal and external pixel array
const arr = initTable(SIZE);
for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length; j++) {
        drawPixel(ctx, arr, i, j);
    }    
}

// create button to save file
const butt = document.getElementById('button')!;
butt.addEventListener('click', (_) => saveFile(arr, 'test.txt'));

// TODO: create button to start fresh

// create the Observable streams
const mouseDown$: Observable<Event> = fromEvent(document, 'mousedown');
const mouseUp$: Observable<Event> = fromEvent(document, 'mouseup');
const mouseMove$: Observable<Event> = fromEvent(document, 'mousemove');
const clickAndDrag$: Observable<Event> = merge(mouseDown$, mouseMove$);
const frames$: Observable<number> = interval(0, animationFrameScheduler);

mouseDown$.pipe(
    // get colour
    map((e) => {
        const _e = e as MouseEvent;
        return (getColor(svg, arr, _e) + 1) % 2;
    }),
    // line up clickAndDrag events with the animation frames
    mergeMap((c: Color) => clickAndDrag$.pipe(
        map((move) => {
                const e = move as MouseEvent;
                return { ...getIndex(getMouse(svg, e)), value: c };
            }
        ),
        takeUntil(mouseUp$),
    )),
    ).subscribe(({i, j, value}) => updatePixel(ctx, arr, i, j, value));
