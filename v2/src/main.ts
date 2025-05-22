import Anthropic from "@anthropic-ai/sdk";
import { Message, MessageParam, ToolUnion } from "@anthropic-ai/sdk/resources";
import { createInterface } from "readline/promises";
import { readFileTool } from "./tool/readFile.js";

const blue = "\u001b[94m";
const reset = "\u001b[0m";
const yellow = "\u001b[93m";

const apiKey = process.env["ANTHROPIC_API_KEY"];
if (typeof apiKey === "undefined")
  throw new Error("ANTHROPIC_API_KEY is undefined");

const client = new Anthropic({
  apiKey: process.env["ANTHROPIC_API_KEY"], // This is the default and can be omitted
});

const tools: ToolUnion[] = [readFileTool.config];

const sendMessage = async (messages: MessageParam[]): Promise<Message> => {
  const result: Message = await client.messages.create({
    max_tokens: 1024,
    messages,
    model: "claude-3-7-sonnet-latest",
    tools,
  });

  return result;
};

const readline = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const main = async () => {
  const messages: MessageParam[] = [];

  console.log(`Chat with Claude (use 'ctrl-c' to quit)\n`);

  let userTurn = true;
  while (true) {
    if (userTurn) {
      const userMessage = await readline.question(`${blue}You${reset}:\n`);
      console.log(); // whitespace

      messages.push({
        content: userMessage,
        role: "user",
      });
    }

    const response = await sendMessage(messages);

    console.log(response);

    for (const content of response.content) {
      if (content.type === "text") {
        console.log(`${yellow}Claude${reset}:\n ${content.text}\n`);
        userTurn = true;
        continue;
      }

      if (content.type === "tool_use") {
        if (content.name === readFileTool.name) {
          const output = await readFileTool.use(content);
          if (output instanceof Error) {
            console.error(output.message);
            continue;
          }

          messages.push({
            role: "user",
            content: [
              {
                type: "tool_result",
                tool_use_id: content.id,
              },
            ],
          });
          userTurn = false;

          continue;
        }
        continue;
      }
    }
    messages.push(response);
  }
};

// async function callWeatherApi(location: string): Promise<string> {
//   // Replace with actual API call
//   return `Weather in ${location} is rainy`;
// }

// type GetWeatherInput = {
//   location: string;
// };

// const validateGetWeatherInput = validateFactory<GetWeatherInput>({
//   location: str,
// });

// async function main() {
//   const response = await client.messages.create({
//     model: "claude-3-7-sonnet-latest",
//     max_tokens: 1024,
//     messages: [{ role: "user", content: "What's the weather in London?" }],
//     tools: [
//       {
//         name: "get_weather",
//         description: "Get the current weather for a location",
//         input_schema: {
//           type: "object",
//           properties: {
//             location: {
//               type: "string",
//               description: "The city and country to get weather for",
//             },
//           },
//           required: ["location"],
//         },
//       },
//     ],
//   });

//   console.log(JSON.stringify(response, null, 2));

//   for (const content of response.content) {
//     if (content.type === "tool_use") {
//       if (content.name === "get_weather") {
//         const input = validateGetWeatherInput(content.input);
//         if (input instanceof Error) throw input;

//         const weatherResult = await callWeatherApi(input.location);

//         const newMsg = await client.messages.create({
//           model: "claude-3-opus-20240229",
//           max_tokens: 1024,
//           messages: [
//             { role: "user", content: "What's the weather in London?" },
//             {
//               role: "assistant",
//               content: [content],
//             },
//             {
//               role: "user",
//               content: [
//                 {
//                   type: "tool_result",
//                   tool_use_id: content.id,
//                   content: weatherResult,
//                 },
//               ],
//             },
//           ],
//         });
//         console.log(newMsg.content);
//       }
//     }
//   }
// }

main();
