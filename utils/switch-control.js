window.addEventListener("keydown", (event) => {
  if (event.key === "c") requestDevice();
});

let device;

function requestDevice() {
  return navigator.usb
    .requestDevice({
      filters: [
        {
          vendorId: 0x0525,
          productId: 0xa4a7,
        },
      ],
    })
    .then((selectedDevice) => {
      device = selectedDevice;
      console.log("Device selected:", device);
      return device.open(); // Open the device
    })
    .then(() => device.selectConfiguration(2)) // Select configuration 2
    .then(() => device.claimInterface(1)) // Claim Interface 1 (the one with bulk endpoints)
    .then(() => {
      console.log("Device ready to receive data.");
      listenForData(); // Start listening for incoming data
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

function listenForData() {
  if (!device) {
    console.error("No device connected.");
    return;
  }

  // Continuously read data from the device
  const readLoop = () => {
    device
      .transferIn(1, 64) // Endpoint 1 IN, max 64 bytes
      .then((result) => {
        const decoder = new TextDecoder();
        const receivedData = decoder.decode(result.data);
        console.log("Data received:", receivedData);

        // Process the received data (e.g., extract the keystroke)
        if ([1, 2, 3].includes(receivedData)) {
          const keystroke = receivedData.split(":")[1].trim();
          console.log("Keystroke detected:", keystroke);

          // You can add custom logic here to handle the keystroke
        }

        // Continue reading data
        readLoop();
      })
      .catch((error) => {
        console.error("Error reading data:", error);
      });
  };

  readLoop();
}
