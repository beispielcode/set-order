import serial
import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

USB_DEVICE = "/dev/ttyGS0"
BAUD_RATE = 9600

def main():
    try:
        # Add retry logic for serial connection
        max_retries = 10
        serial_port = None
        
        for attempt in range(max_retries):
            try:
                serial_port = serial.Serial(USB_DEVICE, BAUD_RATE, timeout=1)
                logger.info("Serial connection established")
                break
            except Exception as e:
                logger.warning(f"Serial connection attempt {attempt + 1} failed: {e}")
                time.sleep(1)
        
        if not serial_port:
            logger.error("Could not establish serial connection")
            return
        
        # Send a test message every 5 seconds
        counter = 0
        while True:
            test_message = str((counter % 3) + 1)  # Cycles through 1, 2, 3
            serial_port.write(test_message.encode())
            logger.info(f"Sending test message: {test_message}")
            
            # Check for incoming data
            if serial_port.in_waiting > 0:
                incoming_data = serial_port.read(serial_port.in_waiting).decode()
                logger.info(f"Received: {incoming_data.strip()}")
            
            time.sleep(5)
            counter += 1
            
    except Exception as e:
        logger.error(f"Error: {e}")
    finally:
        if serial_port:
            serial_port.close()

if __name__ == "__main__":
    main()