(function () {
    const SIXTEENTH_DURATION = 171; //ms
    const AUDIO_CTX = new (window.AudioContext || window.webkitAudioContext)();

    let createElement = function(id, src, cssClass, x, y) {
        let img = document.createElement('img');
        img.setAttribute('id', id + '-image');
        img.setAttribute('src', src);

        let div = document.createElement('div');
        div.setAttribute('id', id);
        div.setAttribute('class', cssClass);
        div.style.left = x;
        div.style.top = y;
        div.appendChild(img);

        document.getElementById('main').appendChild(div);
    }
    let createTextElement = function(id, text, cssClass, x, y) {
        let div = document.createElement('div');
        div.setAttribute('id', id);
        div.setAttribute('class', cssClass);
        div.innerHTML = text;
        div.style.left = x;
        div.style.top = y;
        document.getElementById('main').appendChild(div);
        return div;
    }

    let Main = function () {
        this.dudes = [];
        this.triggers = [];
        this.mm = new MusicMachine();

        this.lastUpdate = Date.now();
        this.deltaTime = 0;
        this.hits = 0; // number of consecutive successful hits
        this.gameStart = Date.now();
        this.lastDance = false;

        this.triggers = this.triggers.concat(new Trigger(0, window.innerWidth / 2 - 400, 200, 'e', [0,1,0,1,0,0,0,0,1,0,1,0,0,1,0,1], 3));
        this.triggers = this.triggers.concat(new Trigger(1, window.innerWidth / 2 - 400, 350, 'g', [0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0], 3));
        this.triggers = this.triggers.concat(new Trigger(2, window.innerWidth / 2 + 400, 200, 'a', [0,0,0,0,1,0,0,1,0,0,0,0,1,0,0,0], 1));
        this.triggers = this.triggers.concat(new Trigger(3, window.innerWidth / 2 + 400, 350, 'h', [0,0,1,0,0,1,0,0,0,1,0,0,0,0,1,0], 1));
        this.triggers = this.triggers.concat(new Trigger(4, window.innerWidth / 2 - 400, 500, 'c', [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], 3));

        for (let i = 0; i < 4; i++) {
            this.dudes = this.dudes.concat(new Dude(
                'dude-' + i,
                Math.random() * (window.innerWidth - 1000) + 500,
                Math.random() * (window.innerHeight - 700) + 350,
                'dude' + (i % 4) + '.png',
                0, 0, 0.2));
        }
        // first fat dude is slow, last illuminati dude is fast
        this.dudes[0].speed = 0.1;
        this.dudes[3].speed = 0.3;
        
        let mainDiv = document.getElementById('main');
        mainDiv.style.width = window.innerWidth;
        mainDiv.style.height = window.innerHeight;

        let self = this;
        let tick = function () {
            var now = Date.now();
            self.deltaTime = now - self.lastUpdate;
            self.lastUpdate = now;

            self.update();
            self.render();
            requestAnimationFrame(tick);
        };
        tick();
    };

    Main.prototype = {
        update: function () {
            if(this.lastDance) {
                for (var i = 0; i < this.dudes.length; i++) {
                    this.dudes[i].update(this);
                }                
                return;
            }

            if(this.hits > 31 && this.mm.noteIndex === 15) {
                this.endGame();
            }

            this.mm.update(this);

            let mouseWasDown = window.mouseDown;
            for (var i = 0; i < this.dudes.length; i++) {
                this.dudes[i].update(this);
            }
            for (var i = 0; i < this.triggers.length; i++) {
                this.triggers[i].update(this);
            }
            if(window.mouseDown && mouseWasDown) {
                for (var i = 0; i < this.dudes.length; i++) {
                    if(this.dudes[i].thought) {
                        this.dudes[i].program1 = -1;
                        this.dudes[i].program2 = -1;
                        this.dudes[i].programTarget = -1;
                        this.dudes[i].targetX = window.mouseX;
                        this.dudes[i].targetY = window.mouseY;
                        this.dudes[i].thought = false;
                        let thoughtToRemove = document.getElementById(this.dudes[i].id + "-thought");
                        thoughtToRemove.parentNode.removeChild(thoughtToRemove);
                        let programToRemove = document.getElementById(this.dudes[i].id + "-program");
                        programToRemove.parentNode.removeChild(programToRemove);
                    }
                }
                window.mouseDown = undefined;
            }
        },

        render: function () {
            this.mm.render();

            let mainDiv = document.getElementById('main');
            mainDiv.style.top = Math.max(0, window.innerHeight / 2);
            mainDiv.style.left = Math.max(0, window.innerWidth / 2);

            for (var i = 0; i < this.dudes.length; i++) {
                this.dudes[i].render(this.lastUpdate);
            }
            for (var i = 0; i < this.triggers.length; i++) {
                this.triggers[i].render(this.lastUpdate);
            }

            if(!this.lastDance) {
                document.getElementById('progress-bar').style.width = Math.min(32, this.hits) * 16;
            }
        }
    };
    Main.prototype.endGame = function() {
        this.lastDance = true;
        this.dudes = [];
        this.triggers = [];
        document.getElementById('main').innerHTML = '';

        for (let i = 0; i < 500; i++) {
            let dude = new Dude(
                'dude-' + i,
                Math.random() * window.innerWidth,
                Math.random() * window.innerHeight,
                'dude' + (i % 4) + '.png',
                0, 0, Math.random() / 5);
            dude.vx = 1;
            this.dudes = this.dudes.concat(dude);
        }

        let finalAudio = new Audio('victory.mp3');
        let duration = new Date(Date.now() - this.gameStart).toISOString().slice(14, -1) ;
        finalAudio.play();
        setTimeout(function() {
            document.getElementById('summary-text').innerHTML = "You won the game in " + duration + "!";
            document.getElementById('summary').style.display = 'block';
        }, 22000);
    };

    let Dude = function (id, x, y, image, vx, vy, speed) {
        // technical attributes
        this.id = id;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.image = image;
        this.direction = 1;

        this.pose = 1;
        this.lastPose = 1;

        this.targetX;
        this.targetY;
        this.thought = false;
        // game attributes
        this.speed = speed; // 4 walks normally, plays full notes, 16 super fast, plays 1/16s
        this.program1 = -1; // 0 - no program, follow mouse pointer, 1-5 triggers
        this.program2 = -1; // the same but for right mouse button, allows double programs
        this.programTarget = -1; // current target
        this.lastAction = 0; // current millis of last action to calculate grace period

        // initialization
        createElement(this.id, this.image, 'dude', this.x, this.y);
    };
    Dude.prototype.constructor = Dude;
    Dude.prototype.update = function (main) {
        if(main.lastDance) {
            this.pose = ~~(Date.now() / (2 * SIXTEENTH_DURATION)) % 2;
            if(this.pose != this.lastPose) {
                this.direction = Math.floor(Math.random() * 4);
                this.lastPose = this.pose;
            }
            return;
        }

        for(let i = 0; i < main.dudes.length; i++) {
            let other = main.dudes[i];
            if(this.id !== ('dude-' + i)) {
                let xclose = Math.abs(other.x - this.x) < 32;
                let yclose = Math.abs(other.y - this.y) < 32;
                if(xclose && yclose) {
                    this.x += Math.random() * 8 - 4;//= this.x + other.x;
                    this.y += Math.random() * 8 - 4;//= this.y + other.y;
                    return;
                }
            }
        }

        if(this.programTarget != -1) {
            let trigger = main.triggers[this.programTarget]
            this.targetX = trigger.x + 45 * (trigger.direction - 1) - 10;
            this.targetY = trigger.y + 30;
        }
        this.distance = Math.sqrt(Math.pow(this.targetX - this.x, 2) + Math.pow(this.targetY - this.y, 2));
        move: if (!this.thought && this.distance > 10) {
            this.vx = this.speed * (this.targetX - this.x) / this.distance;
            this.vy = this.speed * (this.targetY - this.y) / this.distance;

            this.vx *= main.deltaTime;
            this.vy *= main.deltaTime;

            for(let i = 0; i < main.dudes.length; i++) {
                let other = main.dudes[i];
                if(this.id !== ('dude-' + i)) {
                    let xclose = Math.abs(other.x - this.x - this.vx) < 32;
                    let yclose = Math.abs(other.y - this.y - this.vy) < 32;
                    if(xclose && yclose) {
                        this.vx = 0;
                        this.vy = 0;
                        break move;
                    }
                }
            }

            this.x += this.vx;
            this.y += this.vy;

            if (this.vx >= this.vy && this.vx >= -this.vy) {
                this.direction = 3;
            } else if (-this.vy >= this.vx && this.vx >= this.vy) {
                this.direction = 2;
            } else if (this.vx <= this.vy && this.vx <= -this.vy) {
                this.direction = 1;
            } else {
                this.direction = 0;
            }
        } else {
            this.vx = 0;
            this.vy = 0;
        }

        if(window.mouseDown) {
            if(!this.thought && Math.sqrt(Math.pow(window.mouseX - this.x, 2) + Math.pow(window.mouseY - this.y, 2)) < 30) {
                this.vx = 0;
                this.vy = 0;
                this.direction = 0;
                this.thought = true;
                createElement(this.id + '-thought', 'thought.png', 'thought', this.x - 70, this.y - 105);
                createTextElement(this.id + '-program', this.program(main), 'program', this.x - 50, this.y - 90);
                window.mouseDown = false;
            }
        } else if (this.thought) {
            document.getElementById(this.id + '-program').innerHTML = this.program(main);
        }
    };
    Dude.prototype.render = function (lastUpdate) {
        let dudeDiv = document.getElementById(this.id);
        let dudeImg = document.getElementById(this.id + '-image');
        dudeDiv.style.left = (this.x - 32) + 'px';
        dudeDiv.style.top = (this.y - 32) + 'px';
        if (this.vx != 0 || this.vy != 0) {
            dudeImg.style.marginLeft = -((Math.floor(this.speed * lastUpdate / 20) % 4) * 64) + 'px';
        }
        dudeImg.style.marginTop = -(this.direction * 64) + 'px';
    };
    Dude.prototype.program = function (main) {
        let mouseOverId = -1;
        for (var i = 0; i < main.triggers.length; i++) {
            if(Math.sqrt(Math.pow(window.mouseX - main.triggers[i].x, 2) + Math.pow(window.mouseY - main.triggers[i].y, 2)) < 50) {
                mouseOverId = i;
            }
        }
        // Aaaaaaaaaaargh!!!
        if(mouseOverId < 0 && this.program1 < 0) {
            return '?';
        }
        if (mouseOverId < 0 && this.program1 > -1 && this.program2 < 0) {
            return main.triggers[this.program1].note;
        }
        if(mouseOverId === -1) {
            return main.triggers[this.program1].note + ' & ' + main.triggers[this.program2].note;
        }
        if(this.program1 < 0) {
            return main.triggers[mouseOverId].note;
        }
        if(this.program2 > -1) {
            if(mouseOverId === this.program2) {
                return main.triggers[mouseOverId].note;
            }
            return main.triggers[this.program2].note + ' & ' + main.triggers[mouseOverId].note;
        }
        if(mouseOverId === this.program1) {
            return main.triggers[mouseOverId].note;
        }
        return main.triggers[this.program1].note + ' & ' + main.triggers[mouseOverId].note;
    };
    Dude.prototype.nextTarget = function(main) {
        for(let i = 0; i < main.mm.music.length; i++) {
            let j = (i + main.mm.noteIndex + 1) % main.mm.music.length;
            if(main.mm.music[j] === this.program1 || main.mm.music[j] === this.program2) {
                this.programTarget = main.mm.music[j];
                this.targetX = main.triggers[this.programTarget].x;
                this.targetY = main.triggers[this.programTarget].y;
                return;
            }
        }
    }

    let Trigger = function (id, x, y, note, activations, direction) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.note = note;
        this.cooldownEnd = 0;
        this.activations = activations;
        this.direction = direction;

        // initialization
        createElement('trigger' + id, 'trigger.png', 'trigger' + this.direction, this.x, this.y);
    };
    Trigger.prototype.update = function (main) {
        if(this.cooldownEnd > 0 && this.cooldownEnd < Date.now()) {
            this.cooldownEnd = 0;
            document.getElementById('trigger' + this.id + '-image').style.marginTop = '0px';
        }

        if(window.mouseDown && Math.sqrt(Math.pow(window.mouseX - this.x, 2) + Math.pow(window.mouseY - this.y, 2)) < 50) {
            for (var i = 0; i < main.dudes.length; i++) {
                let dude = main.dudes[i];
                if(dude.thought) {
                    if(dude.program1 < 0) {
                        dude.program1 = this.id;
                    } else if(dude.program2 < 0) {
                        dude.program2 = this.id;
                    } else {
                        dude.program1 = dude.program2;
                        dude.program2 = this.id;
                    }
                    dude.programTarget = this.id;
                    dude.thought = false;
                    let thoughtToRemove = document.getElementById(dude.id + "-thought");
                    thoughtToRemove.parentNode.removeChild(thoughtToRemove);
                    let programToRemove = document.getElementById(dude.id + "-program");
                    programToRemove.parentNode.removeChild(programToRemove);
                }
            }
            window.mouseDown = false;
        }
    };
    Trigger.prototype.render = function (lastUpdate) {
    };
    Trigger.prototype.ready = function (main) {
        if(this.cooldownEnd === 0) {
            for (var i = 0; i < main.dudes.length; i++) {
                let dude = main.dudes[i];
                let dudeIsAssigned = !dude.thought && dude.programTarget === this.id;
                let dudeIsClose =  Math.sqrt(Math.pow(dude.x - this.x, 2) + Math.pow(dude.y - this.y, 2)) < 100;
                if(dudeIsAssigned && dudeIsClose) {
                    this.cooldownEnd = Date.now() + (0.4 - dude.speed) * 2000;
                    document.getElementById('trigger' + this.id + '-image').style.marginTop = '-64px';
                    dude.nextTarget(main);
                    return true;
                }
            }
        }
        let triggerImageElement = document.getElementById('trigger' + this.id + '-image');
        triggerImageElement.style.filter = 'blur(5px)';
        setTimeout(function(){
            triggerImageElement.style.filter = '';
            }, 100);
        return false;
    };

    let MusicMachine = function () {
        this.noteIndex = 0;
        this.lastNoteIndex = 15;
        this.highlightBox = createTextElement("highlight-box", "", "highlight-box", window.innerWidth / 2 - 160, 16);
        this.noteSounds = [];
        this.noteSoundsUrls = [
            'https://wysocki.dev/e.wav',
            'https://wysocki.dev/g.wav',
            'https://wysocki.dev/a.wav',
            'https://wysocki.dev/h.wav',
            'https://wysocki.dev/c.wav'];
        for(let i = 0; i < this.noteSoundsUrls.length; i++) {
            fetch(this.noteSoundsUrls[i])
                .then(r => r.arrayBuffer())
                .then(buf => AUDIO_CTX.decodeAudioData(buf))
                .then(decoded => this.noteSounds[i] = decoded);
        }
        this.music = [4,0,3,0,2,3,1,2,0,3,0,1,2,0,3,0];
        this.canPlayNote = false;
    };
    MusicMachine.prototype.update = function(main) {
        this.noteIndex = ~~(Date.now() / SIXTEENTH_DURATION) % 16;
        if(this.noteIndex != this.lastNoteIndex) {
            this.canPlayNote = main.triggers[this.music[this.noteIndex]].ready(main);
            main.hits = this.canPlayNote ? main.hits + 1 : 0;
        }
    };
    MusicMachine.prototype.render = function() {
        if(this.noteIndex != this.lastNoteIndex) {
            this.highlightBox.style.left = window.innerWidth / 2 - 181 + (this.noteIndex) * 26.4;
            this.highlightBox.style.backgroundColor = this.canPlayNote ? 'green' : 'red';
            let source = AUDIO_CTX.createBufferSource();
            source.buffer = this.noteSounds[this.music[this.noteIndex]];
            source.connect(AUDIO_CTX.destination);
            source.start(0, this.canPlayNote ? 0 : 0.3);
            this.lastNoteIndex = this.noteIndex;
        }
    };

    let ClickHandler = function (e) {
        e.preventDefault();
        window.mouseX = e.pageX;
        window.mouseY = e.pageY;        
        window.mouseDown = true;
    }

    let InteractionHandler = function (e) {
        e.preventDefault();
        window.mouseX = e.pageX;
        window.mouseY = e.pageY;
    }

    // run dudes when ready
    window.addEventListener('mousedown', ClickHandler);
    window.addEventListener('mousemove', InteractionHandler);
    window.addEventListener('touchmove', ClickHandler);
    window.addEventListener('touchstart', ClickHandler);
    window.addEventListener('load', function () { new Main(); });
})();
