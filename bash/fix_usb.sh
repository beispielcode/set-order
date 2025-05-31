echo "Fixing USB connection..."

# Find the USB device
DEVICE=$(ls /dev/tty.usbmodem* 2>/dev/null | head -1)

if [ -z "$DEVICE" ]; then
    echo "No USB device found"
    exit 1
fi

echo "Found device: $DEVICE"
echo "Priming connection..."

# Prime the connection
timeout 3 screen "$DEVICE" 9600 < /dev/null &
sleep 1
killall screen 2>/dev/null || true

echo "Connection primed. You can now use the web interface."
