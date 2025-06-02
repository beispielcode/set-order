# SET ORDER

SET ORDER is an interactive installation exploring visual tension between structure and noise. Viewers are invited to shape compositions that dynamically evolve from precise clarity into disorder, examining the thresholds where form dissolves, perception destabilises, and systems collapse. The accompanying publication establishes the conceptual foundation for the installation, systematically examining the principles and limitations of digital graphic representation.

**External Resources:**

- [publication](https://visualcommunication.zhdk.ch/diplom-2025/set-order/)
- [documentation](https://research.beispiel.to/set-order/documentation/)

---

## Live Demo

View the installation in action [here](https://research.beispiel.to/set-order/).

_The demo operates in autonomous mode without hardware controllers. Refer to the [Usage Modes](#usage-modes) section for more information._

---

## Table of Contents

- [Hardware Requirements](#hardware-requirements)
- [System Requirements](#system-requirements)
- [Installation & Setup](#installation--setup)
- [Usage Modes](#usage-modes)
- [Project Structure](#project-structure)
- [Libraries & Dependencies](#libraries--dependencies)
- [Raspberry Pi Configuration](#raspberry-pi-configuration)
- [Troubleshooting](#troubleshooting)
- [Licence](#licence)

## Hardware Requirements

### Essential

- Computer capable of running the installation
- Chrome browser (recommended for optimal performance)

### Optional Components

- **MIDI Controller**: Enables manual control of sliders
- **Raspberry Pi 4**: For rotary switch interface
- **3×4 Rotary Switch**: Limited to 3 positions for scene selection
- **USB-C Cable**: Must support both power delivery and data transfer

## System Requirements

### Development Tools

- **PHP**: For local server
- **OpenSSL/socat**: For HTTPS connection (required for WebMIDI/WebUSB APIs)
- **mkcert**: For generating local SSL certificates
- **screen**: For debugging Raspberry Pi connections

## Installation & Setup

### 1. Clone Repository

```bash
git clone https://github.com/beispielcode/set-order/
cd set-order
```

### 2. Generate SSL Certificates

```bash
mkcert localhost
```

### 3. Start Local Server

```bash
# Terminal 1: Start PHP server
php -S localhost:8000

# Terminal 2: Create secure tunnel
socat OPENSSL-LISTEN:443,reuseaddr,cert=localhost.pem,key=localhost-key.pem,verify=0,fork TCP:localhost:8000
```

### 4. Configure MIDI Controller (Optional)

If using a MIDI controller, map your device's channels in `utils/interface.js`:

```javascript
const controllerMap = {
  // Update these values for your specific MIDI controller
  // ...
};
```

### 5. Configure Raspberry Pi (Optional)

#### Hardware Connections

| Switch Pin | Raspberry Pi Physical Pin | GPIO Pin |
| ---------- | ------------------------- | -------- |
| A (Common) | 9                         | GND      |
| 1          | 11                        | GPIO 17  |
| 2          | 13                        | GPIO 27  |
| 3          | 15                        | GPIO 22  |

#### Software Setup

```bash
# Run the rotary switch script
python3 raspberry-pi/rotary_switch_usb.py

# OR set up as systemd service (see raspberry-pi/rotary_switch_usb.service)
```

#### Configure USB Connection

1. Open `chrome://usb-internals` in Chrome
2. Find your Raspberry Pi's Device ID and Vendor ID
3. Update constants in `utils/switch-control.js` accordingly

### 6. Launch Installation

1. Open `https://localhost` in Chrome
2. Press `c` to establish USB serial connection (if using Raspberry Pi)
3. Grant necessary permissions when prompted

## Usage Modes

The installation automatically detects available hardware and operates in different modes:

_To toggle alternative controls, press `space`._

### Manual Mode

**Requirements**: MIDI controller + Rotary switch  
**Change scene**: Via rotary switch  
**Default controls**: Slider control via MIDI  
**Alternative controls**: Auto-animation

### Manual Switch Mode

**Requirements**: Rotary switch only  
**Change scene**: Via rotary switch  
**Default controls**: Auto-animation  
**Alternative controls**: Scroll while holding `1`/`2`/`3`/`4` keys to emulate MIDI

### Manual MIDI Mode

**Requirements**: MIDI controller only  
**Change scene**: Click  
**Default controls**: Slider control via MIDI  
**Alternative controls**: Auto-animation

### Autonomous Mode

**Requirements**: No external hardware  
**Change scene**: Click  
**Default controls**: Auto-animation  
**Alternative controls**: Scroll while holding `1`/`2`/`3`/`4` keys to emulate MIDI

## Project Structure

```
set-order/
├── assets/
│   └── css/
│       └── style.css
├── config/
│   └── config.php
├── lib/                          # Libraries
│   ├── choreography.js
│   ├── culori.js
│   ├── paper-full.js
│   ├── perlin.js
│   ├── second-order-dynamics.js
│   └── webmidi.iife.js
├── raspberry-pi/                 # Raspberry Pi scripts
│   ├── rotary_switch_usb.py
│   ├── rotary_switch_usb.service
│   ├── switch_pin_test.py
│   └── usb_test.py
├── scenes/                       # Visual environments
│   ├── scene-01-quantisation.js
│   ├── scene-02-colour.js
│   └── scene-03-interpolation.js
├── utils/                        # Core functionality
│   ├── animation-control.js
│   ├── helpers.js
│   ├── interface.js
│   ├── scene-manager.js
│   └── switch-control.js
└── index.php
```

## Libraries & Dependencies

_All libraries are included locally for offline operation._

### JavaScript Libraries

- **[Paper.js](https://github.com/paperjs/paper.js)**: Vector graphics scripting (extended to support p3-colors)
- **[WebMidi.js](https://github.com/djipco/webmidi)**: MIDI controller interface
- **[Culori.js](https://github.com/Evercoder/culori)**: Colour manipulation
- **[Noise.js](https://github.com/josephg/noisejs)**: Noise generation

### Python Libraries (Raspberry Pi)

- **[RPi.GPIO](https://pypi.org/project/RPi.GPIO/)**: GPIO control
- **[pySerial](https://pypi.org/project/pyserial/)**: Serial communication

### Custom Libraries

- **Choreography.js**: JavaScript library for animating attributes in 4-dimensional space
- **Second-order-dynamics.js**: JavaScript implementation based on [@t3ssel8r's implementation](https://www.youtube.com/watch?v=KPoeNZZ6H4s)

## Raspberry Pi Configuration

The Raspberry Pi 4 operates as a USB gadget (`usb_f_acm`) to interface with the rotary switch.

### Requirements

- Raspberry Pi 4 with USB-C power/data cable
- Gadget mode configuration for serial communication
- GPIO pins configured for switch input

### Debugging Commands

**Check USB device recognition:**

```bash
ls /dev/tty.usb*
```

**Monitor serial connection:**

```bash
screen /dev/tty.usbmodemXXXX
```

**Test GPIO connections (Raspberry Pi):**

```bash
python3 raspberry-pi/switch_pin_test.py
```

## Troubleshooting

### Common Issues:

| Issue                               | Solution                                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------------------------ |
| `https://localhost` throws an error | Add `localhost.pem` certificate to browser's trusted list (`chrome://certificate-manager`) |
| MIDI Controller Not Detected        | Ensure WebMIDI permissions are granted in browser                                          |
| Raspberry Pi Connection Issues      | Verify USB-C cable supports data transfer; use screen for debugging                        |
| Performance Issues                  | Use Chrome browser; ensure hardware acceleration is enabled                                |
| SSL Certificate Errors              | Regenerate certificates with mkcert localhost                                              |
| WebUSB API Not Available            | Ensure using HTTPS connection and Chrome browser                                           |

## License

The MIT License (MIT)

Copyright © 2025 BEISPIEL

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
