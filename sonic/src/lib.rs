mod utils;

use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn greet() -> i32 {
    //alert("Hello, sonic!");
    //println!("Hello, sonic!");
    57
}

type V = Vec<f32>;
type M = Vec<Vec<f32>>;

#[wasm_bindgen]
pub fn new_vec(n: i32) -> Vec<i32> {
    (1..n).collect()
}

#[wasm_bindgen]
pub fn vinvout(v: Vec<i32>) -> Vec<i32> {
        v.iter().map(|x| 2*x).collect()
}

struct ANN {
    weights: Vec<Vec<Vec<f32>>>,
    biases: Vec<Vec<f32>>
}

static NLAYERS: usize = 0;

static NET: ANN = ANN {
    weights: vec![],
    biases: vec![]
};

fn linear(x: &V, w: &V, b: &f32) -> f32 {
    x.iter().zip(w.iter()).fold(*b, |acc, xw| acc + *xw.0 * *xw.1)
}

fn linear_layer(x: &V, w: &M, b: &V) -> Vec<f32> {
   w.iter().zip(b.iter()).map(|wb| linear(x, wb.0, wb.1)).collect()
}

fn inner_layer(x: &V, w: &M, b: &V) -> Vec<f32> {
    linear_layer(x, w, b).iter().map(|y| y.abs()).collect()
}

#[wasm_bindgen]
pub fn fast_predict(mut v: Vec<f32>) -> Vec<f32> {
   for i in 0..NLAYERS {
       v = inner_layer(&v, &NET.weights[i], &NET.biases[i]);
   }
   return v;
}
