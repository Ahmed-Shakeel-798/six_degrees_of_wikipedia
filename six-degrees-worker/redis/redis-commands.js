import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function registerLua(redis) {
  const luaPath = (filename) => path.join(__dirname, "lua_scripts", filename);

  redis.defineCommand("initJobData", {
    numberOfKeys: 7,
    lua: fs.readFileSync(luaPath("init_job_data.lua"), "utf8")
  });

  redis.defineCommand("popFrontier", {
    numberOfKeys: 4,
    lua: fs.readFileSync(luaPath("pop_frontier.lua"), "utf8")
  });

  redis.defineCommand("pushJobData", {
    numberOfKeys: 5,
    lua: fs.readFileSync(luaPath("push_job_data.lua"), "utf8")
  });

  redis.defineCommand("fetchFrontierSize", {
    numberOfKeys: 1,
    lua: fs.readFileSync(luaPath("fetch_frontier_size.lua"), "utf8")
  })
}
