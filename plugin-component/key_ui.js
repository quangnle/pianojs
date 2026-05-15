var KeyUI = function (name, o, t, x, y, w, h) {
	this.name = name;
	this.o = o;
	this.t = t;
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
	this.state = 0;
	this.highlighted = false;

	this.getName = function () {
		return this.name.split('/')[0] + this.o;
	};

	this.draw = function () {
		push();
		translate(this.x, this.y);
		if (this.t === 'white') {
			fill('#e8f5e9');
			stroke('#40916c');
		} else {
			fill('#1b4332');
			stroke('#2d6a4f');
		}
		strokeWeight(1);
		rect(0, 0, this.w, this.h, 2);

		if (this.highlighted) {
			noStroke();
			fill('#d8f3a0');
			const dotY = this.t === 'white' ? this.h * 0.72 : this.h * 0.65;
			ellipse(this.w >> 1, dotY, 9, 9);
			fill('#40916c');
			ellipse(this.w >> 1, dotY, 5, 5);
		}
		if (this.state === 1) {
			noStroke();
			fill('#52b788');
			ellipse(this.w >> 1, (this.h >> 1) + (this.h >> 2), 6, 6);
		}
		pop();
	};
};
