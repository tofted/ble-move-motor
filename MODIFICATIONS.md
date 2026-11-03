# Changes from upstream pxt-kitronik-move-motor v0.4.20

| File | Change |
|---|---|
| `pxt.json` | name `pxt-kitronik-move-motor-ble`, version `0.4.21`, description; `Kitronik_WS2811` dependency now `github:YOUR-GITHUB-USERNAME/pxt-kitronik-ws2811-ble#v0.0.3` (replace the placeholder - see `../scripts/prepare-for-github.ps1`). `targetVersions`, `microphone`, `core` unchanged. |
| `main.ts` | **Added** `driveMotors()` plus two private helpers (`clampSignedSpeed`, `signedMotorOn`) after `stop()`. No existing line was changed. |
| `README.md` | Fork notice added at the top. |
| `.github/workflows/makecode.yml` | Removed (pins Node 8). |
| everything else (`main.cpp`, `enums.d.ts`, `shims.d.ts`, docs, locales, assets) | Unchanged. |

ZIP LEDs, sensors (ultrasonic, line following), sounds, pins and all motor blocks are retained.
