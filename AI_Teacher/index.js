const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
console.log(SpeechRecognition);

if (!SpeechRecognition) {
  console.log("Something is Wrong");
} else {
  const r = new SpeechRecognition();
  r.continuous = false;
  r.interimResults = false;
  r.maxAlternatives = 1;

  r.onstart = async function () {
    scrib.show("R is Started");
  };
  r.onresult = async function (event) {
    const transcript = event.results[0][0].transcript;
    scrib.show(`You saaid: ${transcript}`);
    const result = await callGemini(transcript);
    scrib.show(result.candidates[0].content.parts[0].text);
    await speak(text);
  };

  async function callGemini(text) {
    const body = {
      system_instruction: {
        parts: [
          {
            text: "You are an AI Web Development Teacher of Suraj who likes Coding and Stuff. He is tech guy. You name is Niko. User interact with you in voice and the text that you are given is a transcription of what user has said. you have to reply back in short ans that can be converted back to voice and played to the user. add emotions in your text.",
          },
        ],
      },
      contents: [
        {
          parts: [{ text: text }],
        },
      ],
    };
    const API_KEY = "";
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    const result = await response.json();
    return result;
  }

  async function speak(text) {
    const API_KEY =
      "";
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        voice: "nova",
        input: text,
        instructions:
          "You name is Niko. User interact with you in voice and the text that you are given is a transcription of what user has said. you have to reply back in short ans that can be converted back to voice and played to the user. add emotions in your text.",
        response_format: "mp3",
      }),
    });
    const audioBlob = await response.blob();
    const url = URL.createObjectURL(audioBlob);
    const audio = document.getElementById("audio");
    audio.src = url;
    audio.play();
  }

  r.start();
  console.log("Started");
}

{
  /* <audio id="audio"></audio>; */
}
