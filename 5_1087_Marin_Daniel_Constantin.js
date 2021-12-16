"use strict"
window.addEventListener('load', (event) => {
    let text1 = document.createElement('div');
    text1.innerHTML = 'Bine ai venit!\nEsti gata sa lupti pentru a salva planeta?\nRolul tau este sa distrugi cat mai multi asteroizi care ameninta planeta!';
    text1.style.color = "white";
    text1.style.font = "italic bold 30px arial,serif";

    text1.id = "text1";
    document.body.appendChild(text1);

    let btn = document.createElement("button");
    btn.innerHTML = "Incepe jocul!";
    btn.type = "button";
    btn.classList.add("btn");
    btn.classList.add("btn-outline-secondary");
    btn.style.left = "50%";
    btn.style.transform = "translateX(550%)";
    document.body.appendChild(btn);
    btn.addEventListener('click', function () {
        let txt = document.getElementById("text1");
        document.body.removeChild(txt);
        let canvas = document.createElement('CANVAS');
        canvas.id = "gameCanvas";
        canvas.width = "1080";
        canvas.height = "720";
        canvas.style.alignItems = "center";
        document.body.appendChild(canvas);
        const FRAMES = 30; // frames per second
        const FRICTIUNE = 0.7; // coeficinetul de frictiune (0 = deloc, 1 = foarte multa)
        const VIETI = 3; // numarul de vieti maxim
        const DISTANTA_RACHETA = 0.2; // distanta pe care o poate parcurge racheta din dimens ecranului 
        const DURATA_EXPLOZIE_RACHETA = 0.1; // darata exploziei rachetei in sec
        const NR_MAX_RACHETE = 3; // numarul maxim de rachete in acelasi timp 
        const VITEZA_RACHETE = 500; // viteza rachetei px/sec
        const COLTURI_ASTEROIZI = 0.2;
        const PCT_ASTEROID_MARE = 20;
        const PCT_ASTEROID_MEDIU = 50;
        const PCT_ASTEROID_MIC = 100;
        const NR_ASTEROIZI_START = 1;
        const MARIME_ASTEROID = 100;
        const VITEZA_ASTEROID = 50;
        const NR_VARFURI_ASTEROID = 10;
        const CHEIE_SCOR = "highscore"; // cheia de salvare pentru cel mai mare scor in local storage
        const MOD_SIGUR_NAVA_SEC = 0.1; //  durata in secunde pentur o licarire a navei
        const EXPLOZIE_NAVA_SEC = 0.3; // durata exploziei navei
        const NAVA_INVIZIBILA_SEC = 3;
        const MARIME_NAVA = 30;
        const ACC_NAVA = 5; // accelerarea navei in px/sec
        const CENTRUL_NAVEI = true; // arata centrul navei (sau nu)
        const MARIME_TEXT = 40;
        //const MULTIPLU_SCOR = 1; // il folosim pentru a regenera vietile mereu cand este un multiplu de 700
        /** @type {HTMLCanvasElement} */
        //var canvas = document.getElementById("gameCanvas");
        var context = canvas.getContext("2d");
        var multiple = 1;
        // set up the game parameters
        var nivel, vieti, asteroizi, scor, scorMaxim, nava, text, textAlpha;
        jocNou();

        // set up event handlers
        document.addEventListener("keydown", keyDown);
        document.addEventListener("keyup", keyUp);

        // set up the game loop
        setInterval(actualizeaza, 1000 / FRAMES);

        function creeazaAsteroizi() {
            asteroizi = []; //array ul cu asteroizi
            var x, y; // coordonatele asteroizilor
            for (var i = 0; i < NR_ASTEROIZI_START + nivel; i++) {
                // plasarea asteroizilor in mod intamplator fara sa atinga nava
                do {
                    x = Math.floor(Math.random() * canvas.width); // math.floor returneaza cel mai mare nr intreg mai mic sau egal cu parametrul dat
                    y = Math.floor(Math.random() * canvas.height);
                } while (distantaIntrePuncte(nava.x, nava.y, x, y) < MARIME_ASTEROID * 2 + nava.r);
                asteroizi.push(asteroidNou(x, y, Math.ceil(MARIME_ASTEROID / 2)));
            }
        }

        function distrugeAsteroid(i) {
            var x = asteroizi[i].x;
            var y = asteroizi[i].y;
            var r = asteroizi[i].r; //coordonatele asteroidului

            // spargerea asteroidului
            if (r == Math.ceil(MARIME_ASTEROID / 2)) { // asteroid mare
                asteroizi.push(asteroidNou(x, y, Math.ceil(MARIME_ASTEROID / 4))); // math.ceil() rotunjeste un nr la urmatorul nr intreg
                asteroizi.push(asteroidNou(x, y, Math.ceil(MARIME_ASTEROID / 4)));

                scor += PCT_ASTEROID_MARE;
            } else if (r == Math.ceil(MARIME_ASTEROID / 4)) { // asteroid mediu
                asteroizi.push(asteroidNou(x, y, Math.ceil(MARIME_ASTEROID / 6)));
                asteroizi.push(asteroidNou(x, y, Math.ceil(MARIME_ASTEROID / 6)));

                scor += PCT_ASTEROID_MEDIU;
            } else if (r == Math.ceil(MARIME_ASTEROID / 6)) { // asteroid mic
                asteroizi.push(asteroidNou(x, y, Math.ceil(MARIME_ASTEROID / 8)));
                asteroizi.push(asteroidNou(x, y, Math.ceil(MARIME_ASTEROID / 8)));

                scor += PCT_ASTEROID_MEDIU;
            } else {
                scor += PCT_ASTEROID_MIC;
            }

            // verifica cel mai ma re scor
            if (scor > scorMaxim) {
                scorMaxim = scor;
                localStorage.setItem(CHEIE_SCOR, scorMaxim);
            }

            // distrugerea asteroidului
            asteroizi.splice(i, 1);

            // trecerea la nivelul urmator cand nu mai exista asteroizi
            if (asteroizi.length == 0) {
                nivel++;
                nivelNou();
            }
        }

        function distantaIntrePuncte(x1, y1, x2, y2) {
            return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)); // distanta euclidiana dintre doua puncte https://ro.wikipedia.org/wiki/Distan%C8%9B%C4%83_euclidian%C4%83
        }

        function creareNava(x, y, a, colour = "black") {
            context.strokeStyle = colour;
            context.lineWidth = MARIME_NAVA / 20;
            context.beginPath(); // desenarea navei
            context.moveTo( // varful navei
                x + 4 / 3 * nava.r * Math.cos(a),
                y - 4 / 3 * nava.r * Math.sin(a)
            );
            context.lineTo( // stanga spate
                x - nava.r * (2 / 3 * Math.cos(a) + Math.sin(a)),
                y + nava.r * (2 / 3 * Math.sin(a) - Math.cos(a))
            );
            context.lineTo( // dreapta spate 
                x - nava.r * (2 / 3 * Math.cos(a) - Math.sin(a)),
                y + nava.r * (2 / 3 * Math.sin(a) + Math.cos(a))
            );
            context.closePath();
            context.stroke();
        }

        function explozieNava() {
            nava.explodeTime = Math.ceil(EXPLOZIE_NAVA_SEC * FRAMES);
        }

        function SfarsitDeJoc() {
            nava.dead = true;
            text = "Ai pierdut!";
            textAlpha = 1.0;
        }

        function keyDown(/** @type {KeyboardEvent} */ ev) {

            if (nava.dead) {
                return;
            }

            switch (ev.keyCode) {
                case 88: // "x" trage cu racheta
                    creareRacheta();
                    break;
                case 90: // "z" roteste nava spre stanga
                    nava.rot = 360 / 180 * Math.PI / FRAMES;
                    break;
                case 83: // s nava merge spre directia spre care este indreptata
                    nava.thrusting = true;
                    break;
                case 38: // sageata in sus nava se misca in sus
                    nava.y -= 3;
                    break;
                case 40: // sageata in jos nava se misca in jos
                    nava.y += 3;
                    break;
                case 37: // sageata stanga nava se misca in stanga
                    nava.x -= 3;
                    break;
                case 39: // sageata dreapta nava se misca in dreapta
                    nava.x += 3;
                    break;
                case 67: // "c" nava se roteste spre dreapta
                    nava.rot = -360 / 180 * Math.PI / FRAMES;
                    break;
            }
        }

        function keyUp(/** @type {KeyboardEvent} */ ev) {

            if (nava.dead) {
                return;
            }

            switch (ev.keyCode) {
                case 88: // "x" permite sa tragi din nou
                    nava.canShoot = true;
                    break;
                case 90: // "z" se opreste din rotit nava spre stanga
                    nava.rot = 0;
                    break;
                case 83: // s se opreste nava din miscare
                    nava.thrusting = false;
                    break;
                case 38: // sageata in sus nava nu se mai misca in sus
                    nava.y -= 3;
                    break;
                case 40: // sageata in jos nava nu se mai misca in jos
                    nava.y += 3;
                    break;
                case 37: // sageata in dreapta nava nu se mai misca in dreapta
                    nava.x -= 3;
                    break;
                case 39: // sageata in jos nava nu se mai misca in jos 
                    nava.x += 3;
                    break;
                case 67: // "c" nava se opreste din rotit in dreapta
                    nava.rot = 0;
                    break;
            }
        }

        function asteroidNou(x, y, r) {
            var lvlMult = 1 + 0.1 * nivel;
            var roid = {
                x: x,
                y: y,
                xv: Math.random() * VITEZA_ASTEROID * lvlMult / FRAMES * (Math.random() < 0.5 ? 1 : -1),
                yv: Math.random() * VITEZA_ASTEROID * lvlMult / FRAMES * (Math.random() < 0.5 ? 1 : -1),
                //a: Math.random() * Math.PI * 2, // in radians
                r: r,
                offs: [],
                vert: Math.floor(Math.random() * (NR_VARFURI_ASTEROID + 1) + NR_VARFURI_ASTEROID / 2)
            };

            // populate the offsets array
            for (var i = 0; i < roid.vert; i++) {
                roid.offs.push(Math.random() * COLTURI_ASTEROIZI * 2 + 1 - COLTURI_ASTEROIZI);
            }

            return roid;
        }

        function jocNou() {
            nivel = 0;
            vieti = VIETI;
            scor = 0;
            nava = navaNoua();

            // obtinerea celui mai mare scor din localStorage
            var cheieScor = localStorage.getItem(CHEIE_SCOR);
            if (cheieScor == null) {
                scorMaxim = 0;
            } else {
                scorMaxim = parseInt(cheieScor);
            }

            nivelNou();

        }

        function nivelNou() {
            text = "Level " + (nivel + 1);
            textAlpha = 1.0;
            creeazaAsteroizi();
        }

        function navaNoua() {
            return {
                x: canvas.width / 2,
                y: canvas.height / 2,
                a: 90 / 180 * Math.PI, // conversie in radiani
                r: MARIME_NAVA / 2,
                blinkNum: Math.ceil(NAVA_INVIZIBILA_SEC / MOD_SIGUR_NAVA_SEC),
                blinkTime: Math.ceil(MOD_SIGUR_NAVA_SEC * FRAMES),
                canShoot: true,
                dead: false,
                explodeTime: 0,
                lasers: [],
                rot: 0,
                thrusting: false,
                thrust: {
                    x: 0,
                    y: 0
                }
            }
        }

        function creareRacheta() {
            if (nava.canShoot && nava.lasers.length < NR_MAX_RACHETE) {
                nava.lasers.push({ // varful navei
                    x: nava.x + 4 / 3 * nava.r * Math.cos(nava.a),
                    y: nava.y - 4 / 3 * nava.r * Math.sin(nava.a),
                    xv: VITEZA_RACHETE * Math.cos(nava.a) / FRAMES,
                    yv: -VITEZA_RACHETE * Math.sin(nava.a) / FRAMES,
                    dist: 0,
                    explodeTime: 0
                });


            }

            // prevenirea tragerii inainte de creare
            nava.canShoot = false;
        }
        // function drawBgImg() {
        //     let bgImg = new Image();
        //     bgImg.src = '/wallpaper.jpg';
        //     bgImg.onload = () => {
        //         gCtx.drawImage(bgImg, 0, 0, gElCanvas.width, gElCanvas.height);
        //     }
        // }

        function actualizeaza() {
            var blinkOn = nava.blinkNum % 2 == 0;
            var exploding = nava.explodeTime > 0;

            // desenarea "spatiului"
            context.fillStyle = "purple";

            // const image = document.getElementById('source');
            // image.addEventListener('load', function () {
            //     context.drawImage(image, 33, 71, 104, 124, 21, 20, 87, 104);
            //     console.log(image);
            // }

            // );
            //context.clearRect(0, 0, canvas.width, canvas.height); // background transparent
            //drawBgImg();
            //context.fillStyle = "url('https://pixabay.com/images/id-2048727/')";
            context.fillRect(0, 0, canvas.width, canvas.height);

            // desenarea asteroizilor
            var a, r, x, y, offs, varfuri, numar_asteroid;
            for (var i = 0; i < asteroizi.length; i++) {

                context.lineWidth = MARIME_NAVA / 20;

                // proprietatile asteroizilor
                a = asteroizi[i].a;
                r = asteroizi[i].r;
                x = asteroizi[i].x;
                y = asteroizi[i].y;
                offs = asteroizi[i].offs;
                varfuri = asteroizi[i].vert;
                if (r == Math.ceil(MARIME_ASTEROID / 2)) { // daca raza asteroidului este egala cu marimea asteroidului/2 (rotunjita la intreg) 
                    context.strokeStyle = "white";         // atunci acesta este de marime mare si va fi alb
                    numar_asteroid = 4;
                } else if (r == Math.ceil(MARIME_ASTEROID / 4)) {
                    context.strokeStyle = "yellow";
                    numar_asteroid = 3;
                } else if (r == Math.ceil(MARIME_ASTEROID / 6)) {
                    context.strokeStyle = "orange";
                    numar_asteroid = 2;
                } else {
                    context.strokeStyle = "red";
                    numar_asteroid = 1;
                }

                // desenarea path-ului
                context.beginPath();
                context.moveTo(
                    x + r * offs[0] * Math.cos(a),
                    y + r * offs[0] * Math.sin(a),
                );

                // desenarea asteroidului sub forma de cerc si introducerea nr de rachete necesar pentru a fi distrus
                for (var j = 1; j < varfuri; j++) {
                    context.arc(x, y, r, 2 * Math.PI, false);
                    context.font = "20px Arial";
                    if (numar_asteroid == 4) {
                        context.strokeText(numar_asteroid, x, y);
                    } else if (numar_asteroid == 3) {
                        context.strokeText(numar_asteroid, x, y);
                    } else if (numar_asteroid == 2) {
                        context.strokeText(numar_asteroid, x, y);
                    } else if (numar_asteroid == 1) {
                        context.strokeText(numar_asteroid, x, y);
                    }
                    // context.strokeStyle(numar_asteroid, x, y);
                }

                context.closePath();
                context.stroke();
            }
            // regenerare numar vieti
            if (scor > (300 * multiple) && vieti < 3) {
                vieti++;
                multiple++;
            }

            // miscarea rachetei
            if (nava.thrusting && !nava.dead) {
                nava.thrust.x += ACC_NAVA * Math.cos(nava.a) / FRAMES;
                nava.thrust.y -= ACC_NAVA * Math.sin(nava.a) / FRAMES;

                // desenarea efectului de miscare 
                if (!exploding && blinkOn) {
                    context.fillStyle = "skyblue";
                    context.strokeStyle = "yellow";
                    context.lineWidth = MARIME_NAVA / 10;
                    context.beginPath();
                    context.moveTo( // spate stanga
                        nava.x - nava.r * (2 / 3 * Math.cos(nava.a) + 0.5 * Math.sin(nava.a)),
                        nava.y + nava.r * (2 / 3 * Math.sin(nava.a) - 0.5 * Math.cos(nava.a))
                    );
                    context.lineTo( // baza triunghiului in jos pentru efectul de foc
                        nava.x - nava.r * 5 / 3 * Math.cos(nava.a),
                        nava.y + nava.r * 5 / 3 * Math.sin(nava.a)
                    );
                    context.lineTo( // spate dreapta
                        nava.x - nava.r * (2 / 3 * Math.cos(nava.a) - 0.5 * Math.sin(nava.a)),
                        nava.y + nava.r * (2 / 3 * Math.sin(nava.a) + 0.5 * Math.cos(nava.a))
                    );
                    context.closePath();
                    context.fill();
                    context.stroke();
                }
            } else {
                // incetinirea navei cand nu mai este apasat butonul "s"
                nava.thrust.x -= FRICTIUNE * nava.thrust.x / FRAMES;
                nava.thrust.y -= FRICTIUNE * nava.thrust.y / FRAMES;
            }

            // desenarea navei triunghi
            if (!exploding) {
                if (blinkOn && !nava.dead) {
                    creareNava(nava.x, nava.y, nava.a);
                }

                // tratarea licaririi
                if (nava.blinkNum > 0) {

                    // reducerea timpului de licarire
                    nava.blinkTime--;

                    // reducerea numarului de licarire
                    if (nava.blinkTime == 0) {
                        nava.blinkTime = Math.ceil(MOD_SIGUR_NAVA_SEC * FRAMES);
                        nava.blinkNum--;
                    }
                }
            } else {
                // desenarea efectului de explozie cand nava se atinge de asteroid
                context.fillStyle = "darkred";
                context.beginPath();
                context.arc(nava.x, nava.y, nava.r * 1.7, 0, Math.PI * 2, false);
                context.fill();
                context.fillStyle = "darkred";
                context.beginPath();
                context.arc(nava.x, nava.y, nava.r * 1.4, 0, Math.PI * 2, false);
                context.fill();
                context.fillStyle = "purple";
                context.beginPath();
                context.arc(nava.x, nava.y, nava.r * 1.1, 0, Math.PI * 2, false);
                context.fill();
                context.fillStyle = "red";
                context.beginPath();
                context.arc(nava.x, nava.y, nava.r * 0.8, 0, Math.PI * 2, false);
                context.fill();
                context.fillStyle = "darkred";
                context.beginPath();
                context.arc(nava.x, nava.y, nava.r * 0.5, 0, Math.PI * 2, false);
                context.fill();
            }

            // aratarea centrului navei - pentru a nu mai aparea, constanta CENTRUL_NAVEI trebuie setat pe false
            if (CENTRUL_NAVEI) {
                context.fillStyle = "red";
                context.fillRect(nava.x - 1, nava.y - 1, 2, 2);
            }

            // desenarea rachetelor
            for (var i = 0; i < nava.lasers.length; i++) {
                if (nava.lasers[i].explodeTime == 0) {
                    context.fillStyle = "salmon";
                    context.beginPath();
                    context.arc(nava.lasers[i].x, nava.lasers[i].y, MARIME_NAVA / 15, 0, Math.PI * 2, false);
                    context.fill();
                } else {
                    // desenarea exploziei
                    context.fillStyle = "darkred";
                    context.beginPath();
                    context.arc(nava.lasers[i].x, nava.lasers[i].y, nava.r * 0.75, 0, Math.PI * 2, false);
                    context.fill();
                    context.fillStyle = "purple";
                    context.beginPath();
                    context.arc(nava.lasers[i].x, nava.lasers[i].y, nava.r * 0.5, 0, Math.PI * 2, false);
                    context.fill();
                    context.fillStyle = "red";
                    context.beginPath();
                    context.arc(nava.lasers[i].x, nava.lasers[i].y, nava.r * 0.25, 0, Math.PI * 2, false);
                    context.fill();
                }
            }

            // textul jocului
            if (textAlpha >= 0) {
                context.textAlign = "center";
                context.textBaseline = "middle";
                context.fillStyle = "rgba(255, 255, 255, " + textAlpha + ")";
                context.font = "small-caps " + MARIME_TEXT + "px dejavu sans mono";
                context.fillText(text, canvas.width / 2, canvas.height * 0.75);
                textAlpha -= (1.0 / 2.5 / FRAMES);
            } else if (nava.dead) {
                // dupa ce dispare "Ai pierdut", incepe un nou joc
                jocNou();
            }

            // desenarea vietii
            var culoareViata;


            for (var i = 0; i < vieti; i++) {
                if (exploding && i == vieti - 1) {
                    culoareViata = "red";
                }
                else {
                    culoareViata = "white";
                }
                context.strokeText("Numar vieti: ", 70, 60); // alinierea textului de sub vieti cu vietile
                creareNava(MARIME_NAVA + i * MARIME_NAVA * 1.3, MARIME_NAVA, 0.3 * Math.PI, culoareViata);
            }

            // desenarea scorului
            context.textAlign = "right";
            context.textBaseline = "middle";
            context.fillStyle = "white";
            context.font = MARIME_TEXT + "px dejavu sans mono";
            context.fillText(scor, canvas.width - MARIME_NAVA / 2, MARIME_NAVA);

            // desenarea celui mai mare scor
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.fillStyle = "green";
            context.font = (MARIME_TEXT * 0.75) + "px dejavu sans mono";
            context.strokeText("Cel mai bun scor: " + scorMaxim, canvas.width / 2, MARIME_NAVA);

            // detectarea loviturii rachetelor in asteroizi
            var ax, ay, ar, lx, ly;
            for (var i = asteroizi.length - 1; i >= 0; i--) {

                // proprietatile asteroizilor
                ax = asteroizi[i].x;
                ay = asteroizi[i].y;
                ar = asteroizi[i].r;

                // bucla pentru rachete
                for (var j = nava.lasers.length - 1; j >= 0; j--) {

                    // proprietatile rachetelor
                    lx = nava.lasers[j].x;
                    ly = nava.lasers[j].y;

                    // detectarea loviturii
                    if (nava.lasers[j].explodeTime == 0 && distantaIntrePuncte(ax, ay, lx, ly) < ar) {

                        // distrugerea asteroidului si activarea exploziei rachetei
                        distrugeAsteroid(i);
                        nava.lasers[j].explodeTime = Math.ceil(DURATA_EXPLOZIE_RACHETA * FRAMES);
                        break;
                    }


                }
            }

            // verificarea coliziunii cu asteroizii
            if (!exploding) {


                // verifica doar cand nava nu licareste
                if (nava.blinkNum == 0 && !nava.dead) {
                    for (var i = 0; i < asteroizi.length; i++) {
                        if (distantaIntrePuncte(nava.x, nava.y, asteroizi[i].x, asteroizi[i].y) < nava.r + asteroizi[i].r) {
                            explozieNava();
                            distrugeAsteroid(i);
                            break;
                        }
                    }
                }

                // rotirea navei
                nava.a += nava.rot;

                // miscarea navei
                nava.x += nava.thrust.x;
                nava.y += nava.thrust.y;
            } else {
                // decrementarea timplui pentru explozie 
                nava.explodeTime--;

                // recrearea navei dupa ce a explodat
                if (nava.explodeTime == 0) {
                    vieti--;
                    if (vieti == 0) {
                        SfarsitDeJoc();
                    } else {
                        nava = navaNoua();
                    }
                    speechSynthesis.speak(new SpeechSynthesisUtterance("wow, be careful!"))
                }

            }

            // trecerea navei dintr-o parte a ecranului in partea opusa
            if (nava.x < 0 - nava.r) {
                nava.x = canvas.width + nava.r;
            } else if (nava.x > canvas.width + nava.r) {
                nava.x = 0 - nava.r;
            }
            if (nava.y < 0 - nava.r) {
                nava.y = canvas.height + nava.r;
            } else if (nava.y > canvas.height + nava.r) {
                nava.y = 0 - nava.r;
            }

            // miscarea rachetelor
            for (var i = nava.lasers.length - 1; i >= 0; i--) {

                // verificarea distantei parcurse
                if (nava.lasers[i].dist > DISTANTA_RACHETA * canvas.width) {
                    nava.lasers.splice(i, 1);
                    continue;
                }

                // tratarea exploziei
                if (nava.lasers[i].explodeTime > 0) {
                    nava.lasers[i].explodeTime--;

                    // distrugerea rachetelor dupa ce durata s-a incheiat
                    if (nava.lasers[i].explodeTime == 0) {
                        nava.lasers.splice(i, 1);
                        continue;
                    }
                } else {
                    // miscarea rachetelor
                    nava.lasers[i].x += nava.lasers[i].xv;
                    nava.lasers[i].y += nava.lasers[i].yv;

                    // calcularea distantei parcursa de rachete
                    nava.lasers[i].dist += Math.sqrt(Math.pow(nava.lasers[i].xv, 2) + Math.pow(nava.lasers[i].yv, 2));
                }

                // trecerea rachetelor dintr-o parte a ecranului in partea opusa
                if (nava.lasers[i].x < 0) {
                    nava.lasers[i].x = canvas.width;
                } else if (nava.lasers[i].x > canvas.width) {
                    nava.lasers[i].x = 0;
                }
                if (nava.lasers[i].y < 0) {
                    nava.lasers[i].y = canvas.height;
                } else if (nava.lasers[i].y > canvas.height) {
                    nava.lasers[i].y = 0;
                }
            }

            // miscarea asteroizilor
            for (var i = 0; i < asteroizi.length; i++) {
                asteroizi[i].x += asteroizi[i].xv;
                asteroizi[i].y += asteroizi[i].yv;

                // trecerea asteroizilor dintr-o parte a ecranului in partea opusa
                if (asteroizi[i].x < 0 - asteroizi[i].r) {
                    asteroizi[i].x = canvas.width + asteroizi[i].r;
                } else if (asteroizi[i].x > canvas.width + asteroizi[i].r) {
                    asteroizi[i].x = 0 - asteroizi[i].r
                }
                if (asteroizi[i].y < 0 - asteroizi[i].r) {
                    asteroizi[i].y = canvas.height + asteroizi[i].r;
                } else if (asteroizi[i].y > canvas.height + asteroizi[i].r) {
                    asteroizi[i].y = 0 - asteroizi[i].r
                }
            }
        }

        document.body.removeChild(btn);
        let text2 = document.createElement('div');
        text2.innerHTML = 'Regulile sunt simple: pe fiecare asteroid este scris numarul de rachete necesar pentru a-l distruge. La fiecare 300 de puncte obtinute, va fi regenerata o viata. Daca nava se loveste de un asteroid, o viata va fi eliminata. Jocul se termina cand numarul de vieti este egal cu 0. SPOR LA JOC!';
        text2.style.color = "red";
        text2.style.font = "italic bold 30px arial,serif";
        let text3 = document.createElement('div');
        text3.innerHTML = 'Poti controla nava folosind sagetile sau "z", "s", "c" si "x" pentru a trage cu rachete.';
        text3.style.color = "red";
        text3.style.font = "italic bold 30px arial,serif";
        document.body.appendChild(text2);
        document.body.appendChild(text3);
    })
})
