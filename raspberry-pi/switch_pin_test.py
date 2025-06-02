# Rotary switch test script
# 
# This script is intended to be run on a Raspberry Pi connected to a USB gadget serial device.
# The script reads the rotary switch position and prints it to the console.
# 
# The script is written in Python 3 and uses the RPi.GPIO library for GPIO pin control.

import RPi.GPIO as GPIO
import time

# === GPIO PIN CONFIGURATION ===
# Define GPIO pins connected to the rotary switch positions
# The dictionary maps switch positions (1, 2, 3) to their corresponding GPIO pins
pins = {
    1: 17,   # GPIO17
    2: 27,   # GPIO27
    3: 22,   # GPIO22
}

# Set up pins as input with internal pull-up resistors
GPIO.setmode(GPIO.BCM)

# Set up pins as input with internal pull-up resistors
for pin in pins.values():
    GPIO.setup(pin, GPIO.IN, pull_up_down=GPIO.PUD_UP)

# Main loop to read switch position and print to console
try:
    while True:
        for pos, pin in pins.items():
            if GPIO.input(pin) == GPIO.LOW:
                print(f"Switch is in position {pos}")
        time.sleep(0.2)

# Clean up GPIO pins when the script is stopped
finally:
    GPIO.cleanup()
