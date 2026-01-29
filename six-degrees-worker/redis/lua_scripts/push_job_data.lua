-- KEYS:
-- 1 = aliveKey
-- 2 = visitedKey
-- 3 = parentKey
-- 4 = depthKey
-- 5 = frontierKey (ZSET)

-- ARGV:
-- 1 = article
-- 2 = parentArticle
-- 3 = depth
-- 4 = score

if redis.call("EXISTS", KEYS[1]) == 0 then
  return 0
end

if redis.call("SADD", KEYS[2], ARGV[1]) == 0 then
  return 0
end

redis.call("HSET", KEYS[3], ARGV[1], ARGV[2])
redis.call("HSET", KEYS[4], ARGV[1], ARGV[3])
redis.call("ZADD", KEYS[5], ARGV[4], ARGV[1])

return 1
