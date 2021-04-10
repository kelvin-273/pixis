mod utils;

use wasm_bindgen::prelude::*;
use ndarray::{arr1, arr2, Array1, Array2};

#[wasm_bindgen]
pub fn xsd() {
    let a = arr2(&[[1, 2, 3],
                   [4, 5, 6]]);

    let b = arr2(&[[6, 5, 4],
                   [3, 2, 1]]);

    let sum = &a + &b;

    println!("{}", a);
    println!("+");
    println!("{}", b);
    println!("=");
    println!("{}", sum);
}

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

pub fn inference(x: Array2<f32>, ws: Vec<Array2<f32>>, bs: Vec<Array1<f32>>) -> Array2<f32> {
    ws.iter()
        .zip(bs.iter())
        .fold(x, |acc, (b, c)| acc + b.dot(c))
}

#[wasm_bindgen]
pub fn new_vec(n: i32) -> Vec<i32> {
    (1..n).collect()
}

#[wasm_bindgen]
pub fn vinvout(v: Vec<i32>) -> Vec<i32> {
        v.iter().map(|x| 2*x).collect()
}
