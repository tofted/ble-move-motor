// :MOVE buggy joystick over Bluetooth UART.  micro:bit V2.
//
// The web page sends ~20 messages a second:   x,y,maxSpeed,turnStyle,sensor
//   x, y       joystick, -100..100 (y up = forward)
//   maxSpeed   top speed 10..100
//   turnStyle  1 tight, 2 standard, 3 wide (same numbers as Kitronik's TurnRadii)
//   sensor     1 = ultrasonic obstacle sensor on, 0 = off
// Letter commands F B L R S + newline still work for testing.
//
// Safety: stops 400 ms after the last message, on disconnect, and on button A.
// Obstacle sensor: warns at WARN_CM, and below SLOW_CM caps forward speed to NEAR_SPEED.
// The micro:bit reports "D,<cm>,<state>" back to the page (state 0 clear, 1 warn, 2 slow).

// ---- Tuning ----
const DEADZONE = 8        // % of stick ignored near the centre
const TIMEOUT_MS = 400
const FORWARD_SIGN = 1    // -1 if pushing up drives backwards
const STEER_SIGN = 1      // -1 if steering is reversed
const WARN_CM = 45
const SLOW_CM = 25
const SLOW_RELEASE_CM = 32   // must get this far away before the slow limit lifts
const NEAR_SPEED = 10     // speed cap when an obstacle is close
const SENSOR_RANGE_CM = 150
const SENSOR_EVERY_MS = 120

let maxSpeed = 60
let turnStyle = 3         // start on the gentlest turning
let sensorOn = true
let lastCommandAt = 0
let moving = false
let connected = false
let distance = 0
let proxState = 0
let clearCount = 0

function drive(left: number, right: number) {
    Kitronik_Move_Motor.driveMotors(left, right)
    moving = left != 0 || right != 0
}

function halt() {
    drive(0, 0)
    Kitronik_Move_Motor.stop()
}

function clamp100(v: number): number {
    if (v != v) {
        return 0
    }
    return Math.max(-100, Math.min(100, v))
}

// Arc steering like Kitronik's turn radius: the inner wheel slows down by up to
// 1/tightness, plus a gentle pivot when the stick is mostly sideways.
function joystick(xRaw: number, yRaw: number) {
    let x = clamp100(xRaw) * STEER_SIGN
    let y = clamp100(yRaw) * FORWARD_SIGN
    if (Math.abs(x) < DEADZONE) {
        x = 0
    }
    if (Math.abs(y) < DEADZONE) {
        y = 0
    }
    x = x / 100
    y = y / 100
    let tight = 3
    let spin = 0.5
    if (turnStyle == 1) {
        tight = 8
        spin = 0.75
    } else if (turnStyle == 3) {
        tight = 1.6
        spin = 0.35
    }
    let inner = 1 - Math.abs(x) * (1 - 1 / tight)
    let pivot = x * spin * (1 - Math.abs(y))
    let left = (x > 0 ? y : y * inner) + pivot
    let right = (x < 0 ? y : y * inner) - pivot
    left = left * maxSpeed
    right = right * maxSpeed
    // Obstacle close: cap speed unless reversing away
    if (sensorOn && proxState == 2 && left + right >= 0) {
        let biggest = Math.max(Math.abs(left), Math.abs(right))
        if (biggest > NEAR_SPEED) {
            left = left * NEAR_SPEED / biggest   // scale both so the turn shape is kept
            right = right * NEAR_SPEED / biggest
        }
    }
    if (Math.abs(left) < 1 && Math.abs(right) < 1) {
        halt()
    } else {
        drive(left, right)
    }
}

// Sensor state with hysteresis. Gets worse instantly, recovers after 2 clear readings.
function updateProximity(d: number) {
    distance = d
    let next = 0
    if (d > 0 && d < SLOW_CM) {
        next = 2
    } else if (proxState == 2 && d > 0 && d < SLOW_RELEASE_CM) {
        next = 2
    } else if (d > 0 && d < WARN_CM) {
        next = 1
    }
    if (next >= proxState) {
        proxState = next
        clearCount = 0
    } else {
        clearCount += 1
        if (clearCount >= 2) {
            proxState = next
            clearCount = 0
        }
    }
}

bluetooth.startUartService()
Kitronik_Move_Motor.stop()

bluetooth.onBluetoothConnected(function () {
    connected = true
    basic.showIcon(IconNames.Yes)
})
bluetooth.onBluetoothDisconnected(function () {
    connected = false
    halt()
    basic.showIcon(IconNames.No)
})

bluetooth.onUartDataReceived(serial.delimiters(Delimiters.NewLine), function () {
    let cmd = bluetooth.uartReadUntil(serial.delimiters(Delimiters.NewLine)).trim().toUpperCase()
    lastCommandAt = control.millis()
    let parts = cmd.split(",")
    if (parts.length >= 2) {
        if (parts.length >= 5) {
            maxSpeed = Math.max(10, Math.min(100, parseInt(parts[2]) || 60))
            turnStyle = Math.max(1, Math.min(3, parseInt(parts[3]) || 3))
            sensorOn = parts[4] == "1"
        }
        joystick(parseInt(parts[0]), parseInt(parts[1]))
    } else if (cmd == "F") {
        joystick(0, 60)
    } else if (cmd == "B") {
        joystick(0, -60)
    } else if (cmd == "L") {
        joystick(-60, 0)
    } else if (cmd == "R") {
        joystick(60, 0)
    } else {
        halt()
    }
})

// Dead-man: stop if messages stop arriving
loops.everyInterval(100, function () {
    if (moving && control.millis() - lastCommandAt > TIMEOUT_MS) {
        halt()
    }
})

// Obstacle sensor: measure, report to the page
loops.everyInterval(SENSOR_EVERY_MS, function () {
    if (sensorOn) {
        updateProximity(Kitronik_Move_Motor.measure(SENSOR_RANGE_CM))
    } else {
        proxState = 0
        distance = 0
    }
    if (connected) {
        bluetooth.uartWriteLine("D," + distance + "," + proxState)
    }
})

input.onButtonPressed(Button.A, function () {
    halt()
})

basic.showIcon(IconNames.Heart)
