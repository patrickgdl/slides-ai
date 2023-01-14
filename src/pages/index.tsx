import Head from "next/head";
import React from "react";

export default function Home() {
  const [text, setText] = React.useState("");
  const [prompt, setPrompt] = React.useState("");

  const handleSubmit = async () => {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
      }),
    });

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    const data = response.body;

    if (!data) {
      return;
    }

    const reader = data.getReader();
    const decoder = new TextDecoder();

    let done = false;
    let tempState = "";

    while (!done) {
      // eslint-disable-next-line no-await-in-loop
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const newValue = decoder
        .decode(value)
        .replaceAll("data: ", "")
        .split("\n\n")
        .filter(Boolean);

      if (tempState) {
        newValue[0] = tempState + newValue[0];
        tempState = "";
      }

      newValue.forEach((newVal) => {
        if (newVal === "[DONE]") {
          return;
        }

        try {
          const json = JSON.parse(newVal) as {
            id: string;
            object: string;
            created: number;
            choices?: {
              text: string;
              index: number;
              logprobs: null;
              finish_reason: null | string;
            }[];
            model: string;
          };

          if (!json.choices?.length) {
            throw new Error("Something went wrong.");
          }

          const choice = json.choices[0];

          setText((prev) => prev + choice.text);
        } catch (error) {
          tempState = newVal;
        }
      });
    }
  };

  const handleChange = (event: { target: { value: string } }) => {
    setPrompt(event.target.value);
  };

  return (
    <>
      <Head>
        <title>SlidesPT AI</title>
        <meta
          name="description"
          content="Generate Brazilian Portuguese slides with AI "
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="px-4 py-5">
        <div className="antialiased mx-auto px-4 py-20 h-screen bg-gray-100">
          <div className="flex flex-col items-center justify-center">
            <h1 className="text-5xl tracking-tighter pb-10 font-bold text-gray-800">
              SlidesPT AI
            </h1>

            <div className="flex w-full sm:w-auto flex-col sm:flex-row mb-10">
              <input
                className="shadow-sm text-gray-700 rounded-sm px-3 py-2 mb-4 sm:mb-0 sm:min-w-[600px]"
                type="text"
                placeholder="Insira aqui um prompt para gerar os slides, ex: 'O que é IA?'"
                onChange={handleChange}
              />
              <button
                className="min-h-[40px] shadow-sm sm:w-[100px] py-2 inline-flex justify-center font-medium items-center px-4 bg-green-600 text-gray-100 sm:ml-2 rounded-md hover:bg-green-700"
                type="button"
                onClick={() => handleSubmit()}
              >
                Gerar
              </button>
            </div>

            <div className="relative flex w-full items-center justify-center">
              <div className="w-full absolute top-0.5 overflow-hidden rounded-2xl bg-white/5 shadow-xl shadow-black/5">
                <div className="w-full  h-[400px] bg-gray-200 rounded-md shadow-md p-4">
                  <p className="text-lg font-bold">Resultado:</p>

                  <p className="text-sm text-gray-600">{text}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
