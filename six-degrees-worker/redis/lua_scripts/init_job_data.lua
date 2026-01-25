-- KEYS:
-- 1 = aliveKey
-- 2 = initializedKey
-- 3 = visitedKey
-- 4 = parentKey
-- 5 = depthKey
-- 6 = frontierKey
-- 7 = statsKey

-- ARGV:
-- 1 = startArticle

if redis.call("EXISTS", KEYS[1]) == 0 then
  return 0
end

-- Only one worker initializes
if redis.call("SET", KEYS[2], "1", "NX") == false then
  return 0
end

redis.call("SADD", KEYS[3], ARGV[1])
redis.call("HSET", KEYS[4], ARGV[1], "")
redis.call("HSET", KEYS[5], ARGV[1], 0)
redis.call("LPUSH", KEYS[6], ARGV[1])
redis.call("HSET", KEYS[7], "totalExpanded", 0)

return 1
