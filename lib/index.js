let saidHello = false;
const VERSION = '1.0.1';
const defaultOptions = {
	dom: document.body, // dom
	startFrame: 0, // 开始帧
	endFrame: 0, // 结束帧
	curFrame: 0, // 当前帧
	prevFrame: 0, // 上一帧
	fps: 25,
	useCanvas: true, // 默认使用 canvas 播放
	loop: 0, // 循环播放
	yoyo: false, // 正序接倒序
}
export default class ImageFramePlayer{
	constructor(prop) {
		const options = Object.assign({},defaultOptions, prop);
		if (options && typeof options !== 'object') {
			console.error("参数设置为对象！");
			return
		}
		this.dom = options.dom;
		this.startFrame = 0;
		this.endFrame = options.imgArr.length - 1;
		this.curFrame = 0;
		this.prevFrame = 0;
		this.fps = options.fps;
		this.useCanvas = options.useCanvas;
		this.loop = options.loop;
		this.yoyo = options.yoyo;
		//序列图实例
		this._imgObjArr = [];
		//监听事件
		this._events = {};
		//是否png
		this._isPng = true;
		//是否播放
		this._isPlay = false;
		//循环次数
		this._times = 0;
		//是否正序播放
		this._asc = true;
		//临时变量
		this._temp = {};
		// canvas
		this._canvas = null;

		for (let k in options.imgArr) {
			const img = new Image();
			img.src = options.imgArr[k];
			this._imgObjArr.push(img);
		}

		this.init();
		this.sayHello();
	}
	init() {
		if(this.dom) this.dom.textContent = "";

		if (this.useCanvas) {
			this._canvas = document.createElement('canvas');
			this._canvas.width = this._canvas.height = 0;
			this._canvas.style.width = this._canvas.style.height = "100%";
			this.ctx = this._canvas.getContext("2d");
			if(this.dom) this.dom.appendChild(this._canvas);

			loadImg(this._imgObjArr[0], ()=>{
				this._isPng = /(\.png(\?|$))|(image\/png;base64)/.test(this._imgObjArr[0].src);
				this.width = this._canvas.width = this._imgObjArr[0].width;
				this.height = this._canvas.height = this._imgObjArr[0].height;
			});
		} else {
			this.mc = document.createElement("div");
			this.mc.setAttribute("class", "mc");
			this.mc.style.width = this.mc.style.height = "100%";
			if(this.dom) this.dom.appendChild(this.mc);
			for (let i = 0; i < this._imgObjArr.length; i++) {
				this._imgObjArr[i].style.opacity = 0;
				this._imgObjArr[i].style.position = "absolute";
				this._imgObjArr[i].style.width = this._imgObjArr[i].style.height = "100%";
				this._imgObjArr[i].style.top = this._imgObjArr[i].style.left = 0;
				this.mc.appendChild(this._imgObjArr[i]);
			}

		}
	}
	//设置参数
	set(attr, value) {
		const _temp = this._temp;
		if (arguments.length === 1 && typeof(arguments[0]) === "object") {
			for (let i in arguments[0]) {
				this[i] = arguments[0][i];
			}
		}
		if (arguments.length === 2) {
			this[arguments[0]] = arguments[1]
		}

		if (attr === "useCanvas") {
			this.init();
		}
		if (attr === "fps") {
			if (this._isPlay) {
				clearInterval(this._interval);
				this._process(_temp.onUpdate, _temp.onComplete);
			}
		}
		if (attr === "startFrame") {
			if (!this._isPlay) {
				this.curFrame = this.startFrame
			}
		}
	}
	get(attr) {
		return this[attr];
	}
	//播放
	play(start, end, options) {

		if(this._isPlay) return;

		let argumentsNum = 0;
		let onComplete, onUpdate;

		for (let i in arguments) {
			switch (typeof(arguments[i])) {
				case "number" :
					if (argumentsNum === 0) {
						this.set("startFrame", arguments[i]);
						argumentsNum++;
					} else {
						this.set("endFrame", arguments[i]);
					}
					break;
				case "object" :
					if (arguments[i].onComplete) onComplete = arguments[i].onComplete;
					delete arguments[i].onComplete;
					if (arguments[i].onUpdate) onUpdate = arguments[i].onUpdate;
					delete arguments[i].onUpdate;
					this.set(arguments[i]);
					break;
			}
		}
		this._temp.onComplete = onComplete;
		this._temp.onUpdate = onUpdate;

		this._asc = this.startFrame < this.endFrame;
		if (!this._isPlay) this.trigger("play");

		this._process(onUpdate, onComplete);
	}
	_process(onUpdate, onComplete) {
		this._interval = setInterval(()=> {
			if (this._imgObjArr[this.curFrame].complete) {
				if (this.useCanvas) {
					if (this._isPng)this.ctx.clearRect(0, 0, this.width, this.height);
					this.ctx.drawImage(this._imgObjArr[this.curFrame], 0, 0, this.width, this.height);
				} else {
					this.mc.childNodes[this.prevFrame].style.opacity = 0;
					this.mc.childNodes[this.curFrame].style.opacity = 1;
				}

				//保存本帧为上一帧
				this.prevFrame = this.curFrame;

				//update回调;
				// console.log(_this.curFrame,_this._times+1,_this._asc);
				this.trigger("update", this.curFrame, this._times + 1, this._asc);
				if (onUpdate) onUpdate(this.curFrame, this._times + 1, this._asc);

				//当yoyo为true时，如果当前帧等于开始或者结束帧 并且 不是第一次播放
				//当yoyo为false时，如果当前帧等于开始或者结束帧 并且 没有进入过判断
				if (
					(this.curFrame === this.endFrame || this.curFrame === this.startFrame) && this._isPlay && !this._temp.repeat
				) {

					if (this.loop && (this._times + 1 < this.loop || this.loop === -1)) {
						if (this.yoyo) {
							if (this._asc) {
								this.curFrame = Math.max(this.startFrame, this.endFrame) - 1;
							} else {
								this.curFrame = Math.min(this.startFrame, this.endFrame) + 1;
							}
							this._asc = !this._asc;
						} else {
							this._temp.repeat = true;
							if (this._asc) {
								this.curFrame = Math.min(this.startFrame, this.endFrame);
							} else {
								this.curFrame = Math.max(this.startFrame, this.endFrame);
							}
						}
						this._times++;
					} else {
						this.stop();
						if (onComplete)onComplete();
					}

				} else {
					if (this._asc) {
						this.curFrame++;
					} else {
						this.curFrame--;
					}
					this._isPlay = true;
					this._temp.repeat = false;
				}

			}
		}, 1000 / this.fps);
	}
	goto(id) {
		this.curFrame = id;

		loadImg(this._imgObjArr[this.curFrame], ()=>{
			if (this.useCanvas) {
				if (this._isPng) this.ctx.clearRect(0, 0, this.width, this.height);
				this.ctx.drawImage(this._imgObjArr[this.curFrame], 0, 0, this.width, this.height);
			} else {
				this.mc.childNodes[this.prevFrame].style.opacity = 0;
				this.mc.childNodes[this.curFrame].style.opacity = 1;
			}
			this.trigger("update", this.curFrame, this._times + 1, this._asc);
		});

	}
	pause() {
		this._isPlay = false;
		this.trigger("pause");
		clearInterval(this._interval);
	}
	stop() {
		this._isPlay = false;
		this.trigger("stop");
		this.curFrame = this.startFrame;
		clearInterval(this._interval);
		this._times = 0;
		// this.goto(this.startFrame);
	}
	on(events, handler) {
		events = events.split(" ");
		for (let i = 0; i < events.length; ++i) {
			if (!this._events[events[i]]) this._events[events[i]] = [];
			this._events[events[i]].unshift(handler);
		}
		//console.log("on", events, this._events)
		return this;
	}
	one(events, handler) {
		const _handler = ()=> {
			handler();
			this.off(events, _handler);
		};
		return this.on(events, _handler);
	}
	off(events, handler) {
		if (events) {
			events = events.split(" ");
			let _events = this._events;
			for (let i = 0; i < events.length; ++i) {
				if (!_events[events[i]]) continue;
				if (!handler) {
					_events[events[i]] = [];
				} else {
					for (let j = _events[events[i]].length - 1; j >= 0; --j) {
						if (_events[events[i]][j] == handler) _events[events[i]].splice(j, 1);
					}
				}
			}
		} else {
			this._events = {};
		}
		//console.log("off", events, this._events)
		return this;
	}
	trigger() {
		let events = Array.prototype.shift.call(arguments);
		events = events.split(" ");
		for (let i = 0; i < events.length; ++i) {
			if (this._events[events[i]]) {
				for (let j = this._events[events[i]].length - 1; j >= 0; --j) {
					try {
						this._events[events[i]][j].apply(this, arguments);
					} catch (e) {
						console.log(e);
					}
				}
			}
		}
		//console.log(events)
		return this;
	}
	destroy() {
		clearInterval(this._interval);
		this.off();
	}
	sayHello() {
		if (saidHello) return;
		if (window.console) {
			window.console.log("ImageFramePlayer " + VERSION + " - https://github.com/ningbonb/image-frame-player");
		}
		saidHello = true;
	}
}
function loadImg(imgObj, callback) {
	if (imgObj.complete) {
		callback();
	} else {
		imgObj.onload = ()=> {
			callback();
		}
	}
}
