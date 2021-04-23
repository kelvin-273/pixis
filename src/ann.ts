type Vector = Array<number>;
type Matrix = Array<Vector>;

interface ANN {
    nLayers: number,
    weights: Array<Matrix>,
    biases: Array<Vector>,
}

interface ANNExec extends ANN {
    edgeValues: Array<Matrix>,
    stages: Array<Vector>
}

function linear(x:Vector, w:Vector, b:number): number {
    let out = b;
    for (let i = 0; i < x.length; i++) {
        out += w[i] * x[i];
        
    }
    return out
}

function linearLayer(x:Vector, w:Matrix, b:Vector): Vector {
    let out = [...b];
    for (let i = 0; i < out.length; i++) {
        out[i] = linear(x, w[i], b[i]);
    }
    return out;
}

function innerLayer(x:Vector, w:Matrix, b:Vector): Vector {
    return linearLayer(x, w, b).map((y) => Math.max(y, 0))
}

function inference(x:Vector, w: Array<Matrix>, b:Array<Vector>): Vector {
    for (let i = 0; i < w.length-1; i++) {
        x = innerLayer(x, w[i], b[i]);
    }
    x = linearLayer(x, w[w.length-1], b[b.length-1]);
    return x;
}

function argmax(x:Vector) {
    if (x.length === 0) { return -1; }
    let out: number = 0;
    let currMax = x[0];
    for (let i = 1; i < x.length; i++) {
        if (x[i] > currMax) {
            out = i;
            currMax = x[i];
        }
    }
    return out;
}

function getEdgeValues(x:Vector, w:Matrix): Matrix {
    let out = new Array(w.length);
    for (let i = 0; i < w.length; i++) {
        out[i] = new Array(w[i].length);
        for (let j = 0; j < w[i].length; j++) {
            out[i][j] = w[i][j]*x[j];
        }
    }
    return out
}

// build the executed network
function inferenceRecord(net:ANN, x:Vector): ANNExec {
    const out = {
        ...net,
        stages: new Array(net.nLayers + 1),
        edgeValues: new Array(net.nLayers),
    }
    for (let i = 0; i < net.nLayers-1; i++) {
        out.stages[i] = [...x];
        out.edgeValues[i] = getEdgeValues(x, net.weights[i]);
        x = innerLayer(x, net.weights[i], net.biases[i]);
    }
    {
        let i = net.nLayers-1;
        out.stages[i] = [...x];
        out.edgeValues[i] = getEdgeValues(x, net.weights[i]);
        x = linearLayer(x, net.weights[i], net.biases[i]);
    }
    out.stages[net.nLayers] = [...x];
    return out
}

function table2Vector(table:Matrix): Vector {
    return Array.prototype.concat(...table);
}

function runInference(net:ANN, table:Matrix): ANNExec {
    return inferenceRecord(net, table2Vector(table));
}

//console.log(linear([4, 3], [2, 1], 5));
//console.log(table2Vector([[4,3,6], [7,3,5]]))

export { inferenceRecord, ANN, ANNExec, argmax };
