# Technical notes

## 1. Why the two extensions were "incompatible"

`pxt-kitronik-ws2811` (and `pxt-ws2812b`, `pxt-neopixel`, and MakeCode's `radio` package) declare `yotta.config.microbit-dal.bluetooth.enabled = 0`. The `bluetooth` package, which My Controller depends on, declares `= 1`. MakeCode refuses two different values for the same key:

    conflict on yotta setting microbit-dal.bluetooth.enabled between extensions bluetooth and Kitronik_WS2811

This was reproduced with the MakeCode compiler (original WS2811 v0.0.2 + My Controller v2.2.8). The setting is a declaration that BLE would conflict with the driver, not something the driver needs in order to work. Removing it resolves the conflict; the compiled V2 build then has `MICROBIT_DAL_BLUETOOTH_ENABLED: 1`.

Other checks:
* My Controller has `disablesVariants: ["mbdal"]`, so projects using it only build for V2 (CODAL); the V1 variant is a stub.
* Namespaces are unique (`Kitronik_WS2811`, `Kitronik_Move_Motor`, `myController`). The original and the fork share namespaces, so they must never be in the same project.
* `core`, `microphone`, `bluetooth` are bundled packages shared by all. MOVE's `targetVersions` (4.0.11) is older than My Controller's (9.0.12); it caused no error and was left as is.

## 2. The "assembly driver" is not what runs on V2

`sendBuffer.asm` is byte-identical to Microsoft's `pxt-ws2812b` and was written for the 16 MHz nRF51. In the micro:bit MakeCode target, `pxtarget.json` contains `"shimRenames": {"sendBufferAsm": "light::sendWS2812Buffer"}`. The compiled output confirms it: all five `sendBuffer` call sites are `bl light::sendWS2812Buffer`; the `sendBufferAsm:` routine is assembled into the image but never called. On V2 the pulses therefore come from `neopixel_send_buffer_nrf52` in `pxt-microbit/libs/core/light.cpp`, tuned for 64 MHz. The `.asm` files were left unmodified because there was no technical reason to touch them and the API stays identical.

## 3. Motor protocol (unchanged)

On V3.1 the motors are driven by WS2811-style chips on pin P12: 6 bytes `[R fwd, R rev, R brake-light, L rev, L fwd, L brake-light]`, preceded by a 255 "shove" frame when starting. `driveMotors()` produces the same layout (checked in a desktop simulation against the `motorOn`/`motorOff` logic). One deliberate difference: it clamps bias-adjusted values at 0, whereas the original can wrap a negative value to about 255 (for example `motorOn(..., 0)` with a bias set). All original functions are untouched.

## 4. Interrupt masking vs Bluetooth - the real limitation

`light.cpp` calls `__disable_irq()` around the bit stream, so BLE SoftDevice interrupts are delayed while a frame is sent. From the timing comments in that file each bit takes about 1.1-1.4 us, so a 6-byte motor frame masks interrupts for roughly 55-70 us (the 300 us reset delay before it is not masked). Nordic's community guidance is not to mask interrupts globally while the SoftDevice runs, and no official safe duration was found ([DevZone discussion](https://devzone.nordicsemi.com/f/nordic-q-a/627/what-is-the-easiest-way-to-disable-all-interrupts/3228)). Therefore:

* Possible effect: delayed radio events - at worst a missed connection event or dropped UART packet, possibly a lost connection if frames are sent in bursts. This is **not measured**; it needs your hardware test.
* ~60 us is short compared with typical BLE connection intervals (milliseconds), which is why it is expected to work, but that is an expectation, not a result.
* The original `move()` sends two motors x (shove frame + 1 ms pause + run frame) on every call. A streaming joystick makes that the main risk, hence `driveMotors()`: one frame, skipped when unchanged, shove only on start/reverse.
* If you see disconnects or resets: lower the joystick update rate in the app; raise `DEADZONE`; quantise speeds in the example (e.g. steps of 10) so fewer updates change the output; avoid ZIP LED `show()` while driving (12 bytes for 4 LEDs, about twice the masked time).

## 5. Alternatives considered (not implemented)

* **Hardware-timed output** (PWM/SPI/I2S with EasyDMA, as Adafruit's nRF52 NeoPixel code does) avoids masking, but needs custom CODAL C++ that coexists with CODAL's own peripheral use and pin P12. Larger and riskier; cannot be validated without hardware.
* **Two micro:bits** (one for BLE, one for the strip/motors) - you have one.
* **SoftDevice-aware critical sections** - not exposed to MakeCode extensions.
* **Calling `light.sendWS2812Buffer` directly** - this is already what runs (section 2).
