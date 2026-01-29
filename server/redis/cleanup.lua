-- KEYS[1] = jobId

local prefix = "sixdeg:" .. KEYS[1] .. ":"

redis.call("DEL",
  prefix .. "visited",
  prefix .. "parent",
  prefix .. "depth",
  prefix .. "frontier",
  prefix .. "stats",
  prefix .. "alive",
  prefix .. "initialized",
  prefix .. "startArticle",
  prefix .. "targetArticle"
)

return 1
