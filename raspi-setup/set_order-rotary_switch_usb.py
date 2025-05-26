import RPi.GPIO as GPIO
import serial
import time

# GPIO pin setup
SWITCH_PINS = [17, 27, 22]  # GPIO pins connected to the rotary switch
GPIO.setmode(GPIO.BCM)  # Use BCM numbering
GPIO.setup(SWITCH_PINS, GPIO.IN, pull_up_down=GPIO.PUD_UP)  # Enable pull-up resistors

# USB serial setup
USB_DEVICE = "/dev/ttyGS0"  # USB gadget serial device
BAUD_RATE = 9600
serial_port = serial.Serial(USB_DEVICE, BAUD_RATE, timeout=1)

# Function to read the rotary switch state
def read_switch_state():
    for i, pin in enumerate(SWITCH_PINS):
        if GPIO.input(pin) == GPIO.LOW:  # Active LOW
            return i  # Return the position index (0, 1, or 2)
    return -1  # No position active

# Main loop
try:
    last_state = -1
    while True:
        # Read the current switch state
        current_state = read_switch_state()
        
        # If the state has changed, send it to the browser
        if current_state != last_state:
            last_state = current_state
            message = f"Switch position: {current_state}\n"
            print(f"Sending: {message.strip()}")
            serial_port.write(message.encode())  # Send data to the browser

        # Check for incoming data from the browser
        if serial_port.in_waiting > 0:
            incoming_data = serial_port.read(serial_port.in_waiting).decode()
            print(f"Received: {incoming_data.strip()}")
            
            # Echo the received data back to the browser
            response = f"Echo: {incoming_data.strip()}\n"
            serial_port.write(response.encode())

        time.sleep(0.1)  # Small delay to avoid high CPU usage

except KeyboardInterrupt:
    print("Exiting...")
    GPIO.cleanup()  # Clean up GPIO pins
    serial_port.close()  # Close the serial port
