//Dohvatimo canvas i sve sto ej potbeno za rad s njim
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

//Konstante:
//Dimenzije 
const W = 800;
const H = 600;

//Broj redaka i stupaca blokova za razbijanje
const ROWS = 5;
const COLS = 10;

//Brzina palice, dimenzije palice i loptice
const PS = 7;      
const PW = 100;    
const PH = 15;     
const BS = 10;     //bit ce kvadrat

//Boje blokova
const COLORS = [
    "rgb(153,51,0)",    //1. red
    "rgb(255,0,0)",     //2. red
    "rgb(255,153,204)", //3. red
    "rgb(0,255,0)",     //4. red
    "rgb(255,255,153)"  //5. red
];

//Stanja u igri(glob):

//Polje svih blokova
let bricks = [];

//Trenutni rezultat i high score
let score = 0;
let hs = 0;

//Zastavice
let run = false;   //Igra aktivna?
let start = true;  //Početni ekran
let lose = false;  //Izgubljeno
let win = false;   //Pobjeđeno

//Palica
let p = {
    x: W / 2 - PW / 2, //početno u sredini
    y: H - 40,         //malo iznad donjeg ruba
    w: PW,
    h: PH,
    dx: 0              //brzina
};

//Loptica
let b = {
    x: W / 2,
    y: H - 60,
    w: BS,
    h: BS,
    dx: 4,             //brzina x os
    dy: -4             //brzina y os, gore
};

//Stvaranje blokova(polje blokova(cigli) u dve dimenzije, svaki blok ima x,y,w,h,boju i aktivnost))
function initBricks() {
    bricks = [];

    for (let r = 0; r < ROWS; r++) {
        bricks[r] = [];

        for (let c = 0; c < COLS; c++) {
            //Izračun x i y pozicije cigle
            let x = 35 + c * ((W - 70 - 9 * 5) / 10 + 5);
            let y = 60 + r * (20 + 5);

            bricks[r][c] = {
                x: x,
                y: y,
                w: (W - 70 - 9 * 5) / 10,
                h: 20,
                c: COLORS[r], //boja bloka u tom redu
                a: true  //aktivni blok
            };
        }
    }
}

//Inicijalizacija igre(vraćanje stvari na početnu vrijednost i poziciju):
function init() {
    //Reset reza
    score = 0;

    //Učitavanje hs-a iz lokalnog spremišta (ako ne postoji -> 0)
    hs = parseInt(localStorage.getItem("hs") || "0");

    //Postavljanje palice nazad na početnu poziciju
    p.x = W / 2 - PW / 2;
    p.y = H - 40;
    p.dx = 0;

    //Reset loptice
    b.x = W / 2;
    b.y = H - 60;
    //Nasumičan smjer brzine u x osi
    b.dx = 4 * (Math.random() < 0.5 ? -1 : 1);
    b.dy = -4;

    //Ponovno generiranje blokova
    initBricks();

    //Reset svih zastavica
    run = false;
    start = true;
    lose = false;
    win = false;
}

//Tipkovnica:

//Tipke za pomicanje palice i pokretanje igre
document.addEventListener("keydown", (e) => {
    if (e.code === "ArrowLeft" || e.code === "KeyA") {
        p.dx = -PS;
    }
    if (e.code === "ArrowRight" || e.code === "KeyD") {
        p.dx = PS;
    }
    if (e.code === "Space" && (start || lose || win)) {
        //SPACE pokreće novu igru s početnog ekrana ili nakon kraja
        init();
        start = false;
        run = true;
    }
});

//Otpuštanje tipki
document.addEventListener("keyup", (e) => {
    //Kada se tipka pusti, palica staje
    if (["ArrowLeft", "KeyA", "ArrowRight", "KeyD"].includes(e.code)) {
        p.dx = 0;
    }
});

//Iscrtavanje palice i loptice (pravokutnici):

function drawRect(o) {
    ctx.fillStyle = o.c || "#fff"; 
    ctx.fillRect(o.x, o.y, o.w, o.h);
}

//Ažuriranje igre(palica, loptica, sudari):

function update() {
    //Nema igre, ne ažurira
    if (!run) return;
    //Palica
    p.x += p.dx;
    //Palica ne može izaći izvan ekrana
    if (p.x < 0) p.x = 0;
    if (p.x + PW > W) p.x = W - PW;
    //Loptica
    b.x += b.dx;
    b.y += b.dy;
    //Sudar s rubovima
    if (b.x < 0 || b.x + BS > W) {
        b.dx *= -1;
    }
    //Sudar s gornjim rubom
    if (b.y < 0) {
        b.dy *= -1;
    }
    //Pad ispod donjeg ruba tj. poraz
    if (b.y + BS > H) {
        lose = true;
        run = false;
        //Sprema se high score
        localStorage.setItem("hs", Math.max(hs, score));
    }
    //Sudar loptice s palicom
    if (
        b.x < p.x + PW &&
        b.x + BS > p.x &&
        b.y + BS > p.y &&
        b.y < p.y + PH
    ) {
        //Odbij lopticu prema gore
        b.dy = -Math.abs(b.dy);
    }

    //Sudari s blokovima
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            let br = bricks[r][c];
            if (!br.a) continue; //preskoči neaktivne blokove

            if (
                b.x < br.x + br.w &&
                b.x + BS > br.x &&
                b.y < br.y + br.h &&
                b.y + BS > br.y
            ) {
                //Blok pogođen
                br.a = false;
                score++;
                //Promijeni smjer tj. brzinu po y osi
                b.dy *= -1;
                //Ako su sve cigle razbijene, pobjeđena igrica
                if (score === ROWS * COLS) {
                    win = true;
                    run = false;
                    localStorage.setItem("hs", Math.max(hs, score));
                }

                //Izlazak iz funkcije, da nnema višestrukih udara u jednom
                return;
            }
        }
    }
}

//Crtanje igre(pozadinu, blokove, palicu i lopticu, tekst):

function draw() {
    //Pozadina(crno)
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    //Blokovi-samo aktivni
    bricks
        .flat()
        .filter((x) => x.a)
        .forEach((br) => {
            ctx.fillStyle = br.c;
            ctx.fillRect(br.x, br.y, br.w, br.h);
        });

    //Palica
    drawRect({ ...p });
    //Loptica
    drawRect({ ...b });
    //Rezultat i najbolji rezultat
    ctx.fillStyle = "#fff";
    ctx.fillText("Score: " + score, 10, 20);

    ctx.fillStyle = "#ff0";
    ctx.fillText("Best: " + hs, 700, 20);

    //Početna poruka
    if (start) {
        ctx.fillStyle = "#fff";
        ctx.fillText("PRESS SPACE", 350, 300);
    }

    //Poruka za izgubljenu igru
    if (lose) {
        ctx.fillStyle = "#ff0";
        ctx.fillText("GAME OVER", 350, 300);
    }

    //Poruka za pobjedu
    if (win) {
        ctx.fillStyle = "#0f0";
        ctx.fillText("YOU WIN!", 350, 300);
    }
}

//Glavne petlja igre:
function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

//Inicijalno postavljanje igre i pokretanje petlje
init();
loop();
