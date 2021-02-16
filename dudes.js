(function () {
    const MAX_SPEED = 0.15;
    const MAX_SPEED_DIST = 120;

    let Main = function () {
        this.boids = [];

        this.lastUpdate = Date.now();
        this.deltaTime = 0;

        for (let i = 0; i < 12; i++) {
            this.boids = this.boids.concat(new Boid(
                'boid-' + i,
                Math.random() * (window.innerWidth - 64) + 32,
                Math.random() * (window.innerHeight - 64) + 32,
                'boid' + (i % 4) + '.png',
                0,    /* horizontal speed [px] */
                0     /* vertical speed [px] */));
        }
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
            for (var i = 0; i < this.boids.length; i++) {
                this.boids[i].update(this);
            }
        },

        render: function () {
            let mainDiv = document.getElementById('main');
            mainDiv.style.top = Math.max(0, window.innerHeight / 2);
            mainDiv.style.left = Math.max(0, window.innerWidth / 2);

            for (var i = 0; i < this.boids.length; i++) {
                this.boids[i].render(this.lastUpdate);
            }
        }
    };

    let Boid = function (id, x, y, image, vx, vy) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.image = image;
        this.direction = 1;
        this.distance = 0;

        // initialization
        let img = document.createElement('img');
        img.setAttribute('id', this.id + '-image');
        img.setAttribute('src', this.image);

        let div = document.createElement('div');
        div.setAttribute('id', this.id);
        div.setAttribute('class', 'boid');
        div.style.left = this.x;
        div.style.top = this.y;
        div.appendChild(img);

        document.getElementById('main').appendChild(div);
    };
    Boid.prototype.constructor = Boid;
    Boid.prototype.update = function (main) {
        for(let i = 0; i < main.boids.length; i++) {
            let other = main.boids[i];
            if(this.id !== ('boid-' + i)) {
                let xclose = Math.abs(other.x - this.x) < 48;
                let yclose = Math.abs(other.y - this.y) < 48;
                if(xclose && yclose) {
                    this.x += Math.random() * 8 - 4;//= this.x + other.x;
                    this.y += Math.random() * 8 - 4;//= this.y + other.y;
                    return;
                }
            }
        }

        this.distance = Math.sqrt(Math.pow(window.mouseX - this.x, 2) + Math.pow(window.mouseY - this.y, 2));
        move: if (this.distance > 10) {
            this.vx = this.distance >= MAX_SPEED_DIST ? MAX_SPEED * (window.mouseX - this.x) / this.distance :
                ((1 - Math.cos(Math.PI * this.distance / MAX_SPEED_DIST)) * (MAX_SPEED / 2)) * (window.mouseX - this.x) / this.distance;
            this.vy = this.distance >= MAX_SPEED_DIST ? MAX_SPEED * (window.mouseY - this.y) / this.distance :
                ((1 - Math.cos(Math.PI * this.distance / MAX_SPEED_DIST)) * (MAX_SPEED / 2)) * (window.mouseY - this.y) / this.distance;

            this.vx *= main.deltaTime;
            this.vy *= main.deltaTime;

            for(let i = 0; i < main.boids.length; i++) {
                let other = main.boids[i];
                if(this.id !== ('boid-' + i)) {
                    let xclose = Math.abs(other.x - this.x - this.vx) < 48;
                    let yclose = Math.abs(other.y - this.y - this.vy) < 48;
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
    };
    Boid.prototype.render = function (lastUpdate) {
        let boidDiv = document.getElementById(this.id);
        let boidImg = document.getElementById(this.id + '-image');
        boidDiv.style.left = (this.x - 32) + 'px';
        boidDiv.style.top = (this.y - 32) + 'px';
        if (this.vx != 0 || this.vy != 0) {
            boidImg.style.marginLeft = -((Math.floor(lastUpdate / 100) % 4) * 64) + 'px';
        }
        boidImg.style.marginTop = -(this.direction * 64) + 'px';
    };

    let InteractionHandler = function (e) {
        e.preventDefault();
        window.mouseX = e.pageX;
        window.mouseY = e.pageY;
    }

    // run boids when ready
    window.addEventListener('mousemove', InteractionHandler);
    window.addEventListener('touchmove', InteractionHandler);
    window.addEventListener('touchstart', InteractionHandler);
    window.addEventListener('load', function () { new Main(); });
})();
