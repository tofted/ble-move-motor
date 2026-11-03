# Changes from upstream pxt-kitronik-move-motor v0.4.20

| File | Change |
|---|---|
| `pxt.json` | name `pxt-kitronik-move-motor-ble`, version `0.4.21`, description; `Kitronik_WS2811` dependency now `github:YOUR-GITHUB-USERNAME/pxt-kitronik-ws2811-ble#v0.0.3` (replace the placeholder - see `../scripts/prepare-for-github.ps1`). `targetVersions`, `microphone`, `core` unchanged. |
| `main.ts` | **Added** `driveMotors()` plus two private helpers (`clampSignedSpeed`, `signedMotorOn`) after `stop()`. No existing line was changed. |
| `README.md` | Fork notice added at the top. |
| `.github/workflows/makecode.yml` | Removed (pins Node 8). |
| everything else (`main.cpp`, `enums.d.ts`, `shims.d.ts`, docs, locales, assets) | Unchanged. |

ZIP LEDs, sensors (ultrasonic, line following), sounds, pins and all motor blocks are retained.

- v0.4.23: removed the Sounds blocks (beep horn, siren) and the microphone dependency to test whether music/sound code crashes Bluetooth (panic 070).
- v0.4.24: added drive.ts (Bluetooth UART joystick program) as a testFile: it loads when this repo is opened as a project (Import URL) and is NOT included when the repo is used as an extension. Added the bluetooth dependency.
- v0.4.25: emptied test.ts (it ran a full-speed rainbow loop on the ZIP LEDs, called the removed beepHorn, and had its own Button A handler). Preset Bluetooth "No Pairing Required" (pairing_mode 0, open 1) in pxt.json.
