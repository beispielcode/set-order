loadScript("../lib/second-order-dynamics.js");

this.onmessage = (e) => {
    const { deltaTime, channels } = e.data;
    const [chan0, chan1, chan2, chan3] = channels;
};