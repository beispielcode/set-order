# USB serial test script
# 
# This script is intended to be run on a Raspberry Pi configured as a USB gadget serial device.
# The script simmulates the rotary switch and sends switch position updates over the USB serial connection.
# 
# The script is written in Python 3 and uses the serial library for serial communication.

import serial
import time
import logging
import os
import threading
from queue import Queue, Empty

# === LOGGING SETUP ===
# Configure logging to display timestamps, log levels, and messages
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# === USB SERIAL CONFIGURATION ===
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
        self.previous_message = None  # Stores the last sent switch position
        self.message_queue = Queue()  # Queue for managing outgoing messages

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
                    time.sleep(2)  # Wait before retrying
                else:
                    logger.error("Failed to establish serial connection after all attempts")
                    return False

    def handle_handshake(self):
        """
        Handle incoming handshake requests from the browser.
        This thread listens for incoming data and responds to handshake requests.
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
                        elif self.handshake_complete:
                            # Echo other incoming data after handshake
                            response = f"Echo: {incoming_data}\n"
                            self.serial_port.write(response.encode())
                            self.serial_port.flush()
                
            except Exception as e:
                logger.error(f"Error in handshake handler: {e}")
                
            time.sleep(0.1)  # Small delay to prevent CPU overload

    def read_switch_position(self):
        """
        Simulate reading the rotary switch position.
        Replace this method with actual GPIO code for real hardware.
        :return: The current switch position as a string (0, 1, or 2)
        """
        # For testing, cycle through positions every 3 seconds
        cycle_time = int(time.time() / 3) % 3
        return str(cycle_time)

    def send_switch_data(self):
        """
        Monitor the rotary switch position and send updates over the serial connection.
        This thread continuously checks the switch position and sends data if it changes.
        """
        while self.is_running:
            try:
                # Only send data if the handshake is complete
                if self.handshake_complete and self.serial_port:
                    switch_position = self.read_switch_position()
                    
                    # Send data only if the position has changed
                    if switch_position and switch_position != self.previous_message:
                        self.serial_port.write(switch_position.encode())
                        self.serial_port.flush()
                        logger.info(f"Sending: {switch_position}")
                        self.previous_message = switch_position
                
            except Exception as e:
                logger.error(f"Error sending switch data: {e}")
                
            time.sleep(0.5)  # Check switch position every 500ms

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
        
        # Start handshake handler thread
        handshake_thread = threading.Thread(target=self.handle_handshake, daemon=True)
        handshake_thread.start()
        
        # Start switch data sender thread
        switch_thread = threading.Thread(target=self.send_switch_data, daemon=True)
        switch_thread.start()
        
        try:
            # Keep the main thread alive
            while self.is_running:
                time.sleep(1)
                
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
            
        logger.info("Service stopped")

def main():
    """
    Entry point for the script. Creates and runs the rotary switch service.
    """
    service = RotarySwitchService()
    service.run()

if __name__ == "__main__":
    main()