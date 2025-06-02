# Rotary switch USB script
# 
# This script is intended to be run on a Raspberry Pi configured as a USB gadget serial device.
# The script listens for incoming data from a browser, and sends rotary switch position updates
# to the browser over the USB serial connection.
# 
# The script is written in Python 3 and uses the RPi.GPIO library for GPIO pin control.
# 
# To use this script as a systemd service, follow the instructions in the `rotary_switch_usb.service` file.

import RPi.GPIO as GPIO
import serial
import time
import logging
import os
import threading

# === LOGGING SETUP ===
# Configure logging to display timestamps, log levels, and messages
logging.basicConfig(
    # level=logging.INFO,  # Log all messages
    level=logging.CRITICAL,  # Only log critical errors
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# === GPIO SETUP ===
# GPIO pins connected to the rotary switch
SWITCH_PINS = [17, 27, 22]  # GPIO pins connected to the rotary switch
GPIO.setmode(GPIO.BCM)  # Use BCM numbering
GPIO.setup(SWITCH_PINS, GPIO.IN, pull_up_down=GPIO.PUD_UP)  # Enable pull-up resistors

# === USB SERIAL SETUP ===
# USB gadget serial device path and baud rate
USB_DEVICE = "/dev/ttyGS0"  # Path to the USB serial device
BAUD_RATE = 9600  # Serial communication baud rate

class RotarySwitchService:
    """
    Service to handle rotary switch input and communicate with a browser over USB serial.
    """
    def __init__(self):
        self.serial_port = None  # Serial port object
        self.is_running = False  # Flag to indicate if the service is running
        self.handshake_complete = False  # Flag to indicate if handshake is complete
        self.last_state = -1  # Last switch position received
        
    def wait_for_device(self, device_path, timeout=60):
        """
        Wait for the USB device to become available.
        :param device_path: Path to the USB device
        :param timeout: Maximum time to wait (in seconds)
        :return: True if the device becomes available, False otherwise
        """
        start_time = time.time()
        while time.time() - start_time < timeout:
            if os.path.exists(device_path):
                logger.info(f"Device {device_path} is available")
                return True
            logger.info(f"Waiting for device {device_path}...")
            time.sleep(2)
        return False

    def initialize_serial(self):
        """
        Initialize the serial connection with multiple retry attempts.
        :return: True if the connection is successful, False otherwise
        """
        max_retries = 10  # Maximum number of retries
        
        for attempt in range(max_retries):
            try:
                # Attempt to open the serial connection
                self.serial_port = serial.Serial(
                    USB_DEVICE, 
                    BAUD_RATE, 
                    timeout=1,
                    write_timeout=1
                )
                logger.info(f"Serial connection established on attempt {attempt + 1}")
                
                # Clear any existing data in the buffers
                self.serial_port.reset_input_buffer()
                self.serial_port.reset_output_buffer()
                
                return True
                
            except serial.SerialException as e:
                logger.warning(f"Serial connection attempt {attempt + 1} failed: {e}")
                if attempt < max_retries - 1:
                    time.sleep(2)
                else:
                    logger.error("Failed to establish serial connection after all attempts")
                    return False

    def read_switch_state(self):
        """
        Read the current state of the rotary switch.
        :return: The position index (0, 1, or 2) or -1 if no position is active
        """
        for i, pin in enumerate(SWITCH_PINS):
            if GPIO.input(pin) == GPIO.LOW:  # Active LOW
                return i  # Return the position index (0, 1, or 2)
        return -1  # No position active

    def handle_incoming_data(self):
        """
        Handle incoming data from the USB serial connection.
        This includes processing handshake requests and echoing other data.
        """
        while self.is_running:
            try:
                if self.serial_port and self.serial_port.in_waiting > 0:
                    # Read incoming data from the serial port
                    incoming_data = self.serial_port.read(self.serial_port.in_waiting).decode().strip()
                    
                    if incoming_data:
                        logger.info(f"Received: {incoming_data}")
                        
                        if "HANDSHAKE" in incoming_data:
                            # Respond to handshake requests
                            logger.info("Handshake request received, sending READY response")
                            response = "READY\n"
                            self.serial_port.write(response.encode())
                            self.serial_port.flush()
                            self.handshake_complete = True
                            logger.info("Handshake completed successfully")
                        elif self.handshake_complete:
                            # Echo other incoming data after handshake
                            response = f"Echo: {incoming_data}\n"
                            self.serial_port.write(response.encode())
                            self.serial_port.flush()
                            logger.info(f"Echoed: {response.strip()}")
                
            except Exception as e:
                logger.error(f"Error handling incoming data: {e}")
                
            time.sleep(0.05)  # Small delay to prevent CPU overload

    def send_switch_updates(self):
        """
        Monitor the rotary switch state and send updates over the serial connection.
        """
        while self.is_running:
            try:
                # Read the current switch state
                current_state = self.read_switch_state()
                
                # Only send data if the handshake is complete and the state has changed
                if (self.handshake_complete and 
                    current_state != self.last_state and 
                    current_state != -1):  # Only send valid positions (0, 1, 2)
                    
                    self.last_state = current_state
                    message = f"{current_state}"  # Send 0, 1, 2
                    
                    if self.serial_port:
                        self.serial_port.write(message.encode())
                        self.serial_port.flush()
                        logger.info(f"Switch position changed - Sending: {message}")
                
            except Exception as e:
                logger.error(f"Error sending switch updates: {e}")
                
            time.sleep(0.1)  # Check switch state every 100ms

    def send_periodic_heartbeat(self):
        """
        Send periodic heartbeat messages to maintain the connection.
        """
        while self.is_running:
            try:
                if self.handshake_complete and self.serial_port:
                    # Send a heartbeat message every 30 seconds
                    heartbeat = "HEARTBEAT\n"
                    self.serial_port.write(heartbeat.encode())
                    self.serial_port.flush()
                    logger.debug("Heartbeat sent")
                    
            except Exception as e:
                logger.error(f"Error sending heartbeat: {e}")
                
            time.sleep(30)  # Send heartbeat every 30 seconds

    def run(self):
        """
        Main service loop to start the rotary switch service.
        """
        logger.info("Starting rotary switch service...")
        
        # Wait for the USB device to be ready
        if not self.wait_for_device(USB_DEVICE):
            logger.error(f"Device {USB_DEVICE} not available after timeout")
            return
        
        # Initialize the serial connection
        if not self.initialize_serial():
            logger.error("Failed to initialize serial connection")
            return
        
        self.is_running = True
        logger.info("Service started, waiting for handshake...")
        
        # Start background threads for handling data, switch updates, and heartbeats
        incoming_thread = threading.Thread(target=self.handle_incoming_data, daemon=True)
        switch_thread = threading.Thread(target=self.send_switch_updates, daemon=True)
        heartbeat_thread = threading.Thread(target=self.send_periodic_heartbeat, daemon=True)
        
        incoming_thread.start()
        switch_thread.start()
        heartbeat_thread.start()
        
        try:
            # Keep the main thread alive and log status updates
            while self.is_running:
                if not self.handshake_complete:
                    logger.info("Waiting for handshake from browser...")
                time.sleep(10)  # Status update every 10 seconds
                
        except KeyboardInterrupt:
            logger.info("Service interrupted by user")
        except Exception as e:
            logger.error(f"Service error: {e}")
        finally:
            self.cleanup()

    def cleanup(self):
        """
        Clean up resources when the service is stopped.
        """
        logger.info("Cleaning up...")
        self.is_running = False
        
        if self.serial_port:
            self.serial_port.close()
            
        GPIO.cleanup()  # Clean up GPIO pins
        logger.info("Service stopped")

def main():
    """
    Entry point for the script. Creates and runs the rotary switch service.
    """
    service = RotarySwitchService()
    service.run()

if __name__ == "__main__":
    main()
