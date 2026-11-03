// Drive a Kitronik :MOVE Motor Buggy V3.1 from the "my micro:bit" app (My Controller),
// using the LEFT joystick.  micro:bit V2 only.
//
//   joystick up/down    -> forward / reverse
//   joystick left/right -> steer (arcade-style mixing)
//   button A on micro:bit, or losing the Bluetooth connection -> motors stop

// ---- Tuning --------------------------------------------------------------
// Largest value the app's joystick sends on one axis. Set the joystick range in
// the app to match (or change this number). Larger values are clamped.
const JOY_MAX = 100
const DEADZONE = 10      // % of full deflection that is ignored (stops creeping)
const MAX_SPEED = 60     // top speed 0-100. Start low for the first test on the floor.
const FORWARD_SIGN = 1   // set to -1 if pushing the joystick up drives the buggy backwards
const STEER_SIGN = 1     // set to -1 if the buggy steers the wrong way

let joyX = 0
let joyY = 0

// Convert a raw joystick value to a percentage in -100..100 with a dead zone
function shape(raw: number): number {
    if (raw != raw) {
        return 0 // NaN guard
    }
    let percent = Math.round(raw * 100 / JOY_MAX)
    if (percent > 100) {
        percent = 100
    }
    if (percent < -100) {
        percent = -100
    }
    if (Math.abs(percent) < DEADZONE) {
        return 0
    }
    return percent
}

function updateMotors() {
    let throttle = shape(joyY) * FORWARD_SIGN
    let steer = shape(joyX) * STEER_SIGN
    let left = throttle + steer
    let right = throttle - steer
    // If the mix goes past 100, scale both down so the turn ratio is kept
    let biggest = Math.max(Math.abs(left), Math.abs(right))
    if (biggest > 100) {
        left = left * 100 / biggest
        right = right * 100 / biggest
    }
    Kitronik_Move_Motor.driveMotors(left * MAX_SPEED / 100, right * MAX_SPEED / 100)
}

function stopBuggy() {
    joyX = 0
    joyY = 0
    Kitronik_Move_Motor.stop()
}

myController.useBluetooth()
Kitronik_Move_Motor.stop() // detects the board version and starts with the motors stopped

myController.onCommandReceived(function () {
    if (myController.leftJoystickChanged(myController.JoystickDirection.X)) {
        joyX = myController.commandValueAsNumber()
        updateMotors()
    } else if (myController.leftJoystickChanged(myController.JoystickDirection.Y)) {
        joyY = myController.commandValueAsNumber()
        updateMotors()
    }
})

// Safety stops
bluetooth.onBluetoothDisconnected(function () {
    stopBuggy()
})
input.onButtonPressed(Button.A, function () {
    stopBuggy()
})
