import dgram from "dgram";
const BULB_IP = "192.168.29.235";
const PORT = 38899;

export async function turnOnBulb() {
  const client = dgram.createSocket("udp4");
  const message = JSON.stringify({
    method: "setState",
    params: {
      state: true,
    },
  });

  client.send(message, PORT, BULB_IP, (err) => {
    console.log("Err", err);
    client.close();
  });
}

export async function turnOffBulb() {
  const client = dgram.createSocket("udp4");
  const message = JSON.stringify({
    method: "setState",
    params: {
      state: false,
    },
  });

  client.send(message, PORT, BULB_IP, (err) => {
    console.log("Err", err);
    client.close();
  });
}

export async function changeColour({
  r,
  g,
  b,
  dimming,
}: {
  r: number;
  g: number;
  b: number;
  dimming: number;
}) {
  const client = dgram.createSocket("udp4");
  const message = JSON.stringify({
    method: "setState",
    params: {
      state: true,
      dimming,
      r,
      g,
      b,
    },
  });

  client.send(message, PORT, BULB_IP, (err) => {
    console.log("Err", err);
    client.close();
  });
}
