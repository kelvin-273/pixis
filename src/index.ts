import { Observable, interval, fromEvent, animationFrameScheduler } from "rxjs";
import { mergeMap, takeUntil } from 'rxjs/operators';

const SIZE = 28;
const PIXEL_SIZE = 20;
const GAP_SIZE = 2;

type Table = Array<Array<number>>;

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

function draw_pixel(
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
        draw_pixel(ctx, arr, i, j);
    }    
}

// create the Observable streams
const mouseDownObs$ = fromEvent(svg, 'mousedown');
const mouseUpObs$ = fromEvent(svg, 'mouseup');
const mouseMoveObs$ = fromEvent(svg, 'mousemove');
const obs$: Observable<number> = interval(1000);
const frames$: Observable<number> = interval(0, animationFrameScheduler);

// create a chain: mousedown -> mousemove -> mouseup
mouseDownObs$.subscribe((_) => console.log("there we go!"));
mouseDownObs$.pipe(
    mergeMap((_) => mouseMoveObs$.pipe(takeUntil(mouseUpObs$)))
).subscribe(console.log);
mouseUpObs$.subscribe((_) => console.log("DROP THE MOUSE!"));

// time dependent streams
//obs.pipe(takeUntil(mouseUpObs)).subscribe(console.log);
//frames$.pipe(takeUntil(mouseUpObs)).subscribe(console.log);
