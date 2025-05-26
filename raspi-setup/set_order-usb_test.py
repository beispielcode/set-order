import serial
import time
import sys
import termios
import tty

# USB serial setup
USB_DEVICE = "/dev/ttyGS0"  # USB gadget serial device
BAUD_RATE = 9600
serial_port = serial.Serial(USB_DEVICE, BAUD_RATE, timeout=1)

# Function to read a single keystroke
def get_keystroke():
    fd = sys.stdin.fileno()
    old_settings = termios.tcgetattr(fd)
    try:
        tty.setraw(fd)
        keystroke = sys.stdin.read(1)
    finally:
        termios.tcsetattr(fd, termios.TCSADRAIN, old_settings)
    return keystroke

# Main loop
try:
    print("Press keys to send them to the browser. Press 'q' to quit.")
    while True:
        # Read a single keystroke
        keystroke = get_keystroke()
        
        # Exit if 'q' is pressed
        if keystroke == "q":
            print("Exiting...")
            break
        if keystroke == "1" or keystroke == "2" or keystroke == "3":
            message = keystroke
            print(f"Sending: {message.strip()}")
            serial_port.write(message.encode())  # Send data to the browser
        else:
            print("Invalid keystroke. Press 'q' to quit.")

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
    serial_port.close()  # Close the serial port
