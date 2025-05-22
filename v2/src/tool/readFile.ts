import { Tool, ToolUseBlock } from "@anthropic-ai/sdk/resources";
import fs from "fs/promises";
import { join } from "path";
import { str, validateFactory } from "../validate.js";

const toolName = "readFile";

const inputSchema: Tool["input_schema"] = {
  type: "object",
  properties: {
    path: {
      type: "string",
      description: "The relative path of a file in the working directory.",
    },
  },
  required: ["path"],
};

type ReadFileInput = {
  path: string;
};

const validateInput = validateFactory<ReadFileInput>({
  path: str,
});

const run = async (input: ReadFileInput): Promise<string | Error> => {
  const path = join(process.cwd(), input.path);

  console.log(path);

  let result: Buffer;
  try {
    result = await fs.readFile(input.path);
  } catch (error) {
    if (!(error instanceof Error)) throw error;
    return error;
  }

  return result.toString();
};

const config: Tool = {
  name: toolName,
  description:
    "Read the contents of a given relative file path. Use this when you want to see what's inside a file. Do not use this with directory names.",
  input_schema: inputSchema,
};

const use = async (content: ToolUseBlock): Promise<string | Error> => {
  const input = validateInput(content.input);
  if (input instanceof Error) return input;

  return run(input);
};

export const readFileTool = {
  config,
  name: toolName,
  use,
};
