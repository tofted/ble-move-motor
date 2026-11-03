# Changes from upstream pxt-kitronik-ws2811 v0.0.2

| File | Change |
|---|---|
| `pxt.json` | Removed `yotta.config.microbit-dal.bluetooth.enabled = 0` (the cause of `conflict on yotta setting microbit-dal.bluetooth.enabled between extensions bluetooth and Kitronik_WS2811`). Renamed package to `pxt-kitronik-ws2811-ble`, version `0.0.3`, new description. |
| `README.md` | Rewritten to describe the fork and the interrupt-masking limitation. |
| `MODIFICATIONS.md` | This file. |
| `.github/workflows/makecode.yml` | Removed (it pins Node 8 and would fail on a new repository). |
| `main.ts`, `sendBuffer.asm`, `setBufferMode.asm`, `test.ts`, `LICENSE` | **Unchanged.** |

Namespace is still `Kitronik_WS2811` so `pxt-kitronik-move-motor-ble` (and any code written against upstream) works unchanged.
