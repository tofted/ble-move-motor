// Drive the :MOVE buggy over Bluetooth UART.
// Joystick page sends "x,y" + newline (each -100..100, y up = forward), ~20 times a second.
// Letter commands still work too: F B L R S + newline.
// Stops by itself 400 ms after the last message.

const MAX_SPEED = 100     // overall cap 0-100 (the page also has its own slider)
const DEADZONE = 8
const TIMEOUT_MS = 400
const FORWARD_SIGN = 1    // -1 if pushing up drives backwards
const STEER_SIGN = 1      // -1 if steering is reversed
let lastCommandAt = 0
let moving = false

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

function joystick(x: number, y: number) {
    x = clamp100(x) * STEER_SIGN
    y = clamp100(y) * FORWARD_SIGN
    if (Math.abs(x) < DEADZONE) {
        x = 0
    }
    if (Math.abs(y) < DEADZONE) {
        y = 0
    }
    let left = y + x
    let right = y - x
    let biggest = Math.max(Math.abs(left), Math.abs(right))
    if (biggest > 100) {
        left = left * 100 / biggest
        right = right * 100 / biggest
    }
    if (left == 0 && right == 0) {
        halt()
    } else {
        drive(left * MAX_SPEED / 100, right * MAX_SPEED / 100)
    }
}

bluetooth.startUartService()
Kitronik_Move_Motor.stop()

bluetooth.onBluetoothConnected(function () {
    basic.showIcon(IconNames.Yes)
})
bluetooth.onBluetoothDisconnected(function () {
    halt()
    basic.showIcon(IconNames.No)
})

bluetooth.onUartDataReceived(serial.delimiters(Delimiters.NewLine), function () {
    let cmd = bluetooth.uartReadUntil(serial.delimiters(Delimiters.NewLine)).trim().toUpperCase()
    lastCommandAt = control.millis()
    let parts = cmd.split(",")
    if (parts.length == 2) {
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

input.onButtonPressed(Button.A, function () {
    halt()
})

basic.showIcon(IconNames.Heart)
