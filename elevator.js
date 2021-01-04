{
    init: function(elevators, floors) {
        console.clear();
        for (let i = 0; i < floors.length; i++) {
            floors[i].up = false;
            floors[i].down = false;
            floors[i].callElevator = function(direction) {
                let minDist = 1E+5;
                let eleIdx = -1;
                for(let i = 0; i < elevators.length; i++) {
                    const ele = elevators[i];
                    let dist = ele.currentFloor() - this.floorNum();
                    switch (ele.destinationDirection()) {
                        case "down": dist = -dist; break;
                        case "stopped": dist = Math.abs(dist); break;
                    }
                    //console.log("ele: " + i + ", dist: " + dist + ", res: " + ele.reserved + ", drctn: " + ele.destinationDirection());
                    if (
                        ele.loadFactor() < 1 &&
                        (ele.reserved === -1 || ele.reserved === this.floorNum()) &&
                        (
                            ele.destinationDirection() === "stopped" ||
                            (ele.destinationDirection() === direction && dist >= 0)
                        ) &&
                        dist < minDist
                    ) {
                        minDist = dist;
                        eleIdx = i;
                    }
                }
                if (eleIdx === -1)
                    eleIdx = Math.floor(Math.random() * elevators.length);
                const minEle = elevators[eleIdx];
                console.log("call: " + direction + ", floor: " + this.floorNum() + ", ele: " + eleIdx + ", minDist: " + minDist);
                if (minEle.destinationDirection() === "stopped")
                    minEle.reserved = this.floorNum();
                if (minDist === 0)
                    minEle.setIndicator(direction);
                else
                    minEle.shedule(this.floorNum());
                this[direction] = true;
            };
            
            floors[i].on("up_button_pressed", function() {
                this.callElevator("up");
            });
            
            floors[i].on("down_button_pressed", function() {
                this.callElevator("down");
            });
        }

        for (let i = 0; i < elevators.length; i++) {
            elevators[i].reserved = -1;
            elevators[i].idx = i;

            elevators[i].shedule = function(floorNum) {
                this.goToFloor(floorNum);
            };

            elevators[i].setIndicator = function(direction) {
                this.goingUpIndicator(true);
                this.goingDownIndicator(true);
                switch (direction) {
                    case "up": this.goingDownIndicator(false); break;
                    case "down": this.goingUpIndicator(false); break;
                }
            };
            elevators[i].setIndicator("up");

            elevators[i].on("idle", function() {
            });

            elevators[i].on("floor_button_pressed", function(floorNum) {
                console.log("PressFloor: " + floorNum + ", ele: " + this.idx);
                this.shedule(floorNum);
                this.reserved = -1;
            });

            elevators[i].on("passing_floor", function(floorNum, direction) {
                if (
                    (floors[floorNum][direction] && this.loadFactor() < 1) ||
                    (this.destinationQueue.indexOf(floorNum) !== -1)
                ) {
                    this.goToFloor(floorNum, true);
                }
            });
            
            elevators[i].on("stopped_at_floor", function(floorNum) {
                var direction;
                this.reserved = -1;
                if (this.destinationQueue.length === 0) {
                    if (floors[floorNum].up)
                        direction = "up";
                    else if (floors[floorNum].down)
                        direction = "down";
                } else {
                    if (this.destinationQueue[0] > floorNum)
                        direction = "up";
                    else
                        direction = "down";
                }
                this.setIndicator(direction);
                if (direction)
                    floors[floorNum][direction] = false;
                if (!floors[floorNum]["up"] && !floors[floorNum]["down"]) {
                    for (let eleIdx = 0; eleIdx < elevators.length; eleIdx++) {
                        const ele = elevators[eleIdx];
                        const newQueue = [];
                        const eleButtons = ele.getPressedFloors();
                        let modified = false;
                        for (let i = 0; i < this.destinationQueue.length; i++) {
                            if (ele.destinationQueue[i] !== floorNum || eleButtons.indexOf(floorNum) !== -1)
                                newQueue.push(this.destinationQueue[i]);
                            else
                                modified = true;
                        }
                        if (modified) {
                            ele.destinationQueue = newQueue;
                            ele.checkDestinationQueue();
                        }
                    }

                }
            });
            elevators[0].setIndicator("up");
        }

    },
    update: function(dt, elevators, floors) {
        // We normally don't need to do anything here
    }
}
