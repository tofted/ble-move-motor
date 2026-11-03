# pxt-kitronik-ws2811-ble

A **Bluetooth-compatible fork** of [KitronikLtd/pxt-kitronik-ws2811](https://github.com/KitronikLtd/pxt-kitronik-ws2811) (v0.0.2) for **micro:bit V2**.

The only functional change: the `yotta.config.microbit-dal.bluetooth.enabled = 0` block was removed from `pxt.json`, so this package no longer conflicts with the `bluetooth` package (and therefore with extensions such as [My Controller](https://github.com/aorczyk/my-controller)). The public API (`Kitronik_WS2811.sendBuffer`, `Kitronik_WS2811.setBufferMode`), `main.ts`, `sendBuffer.asm` and `setBufferMode.asm` are unchanged. See [MODIFICATIONS.md](MODIFICATIONS.md).

> **Used by the :MOVE Motor V3.1.** On that board this driver is not just for the ZIP LEDs - it is how the micro:bit talks to the motor controller (pin P12). Do not remove it.

## ~ hint

**Bluetooth is no longer disabled by this package, but the driver still masks interrupts while it sends a frame.**
On micro:bit V2, `sendBuffer` is routed by MakeCode to `light::sendWS2812Buffer`, which wraps the transmission in `__disable_irq()` / `__enable_irq()` (about 55-70 microseconds for a 6-byte motor frame). Send as few frames as you can while Bluetooth is connected, and see
[../docs/TECHNICAL-NOTES.md](../docs/TECHNICAL-NOTES.md) for the details and limits.

## ~

## Usage

### sendBuffer

``Kitronik_WS2811.sendBuffer`` bit-bangs a buffer for WS2811 ICs over a pin.

### setBufferMode

Specifies the colour layout in the buffer (a no-op in this package, as upstream).

```
#define LIGHTMODE_RGB 1
#define LIGHTMODE_RGBW 2
#define LIGHTMODE_RGB_RGB 3
```

## Important

* micro:bit **V2** only. (The upstream package also targeted V1; this fork has not been built or tested for V1.)
* Do not add the original `pxt-kitronik-ws2811` / `pxt-kitronik-move-motor` to the same project: both define the namespace `Kitronik_WS2811`.

## License

MIT (unchanged from upstream)

## Supported targets

* for PXT/microbit
