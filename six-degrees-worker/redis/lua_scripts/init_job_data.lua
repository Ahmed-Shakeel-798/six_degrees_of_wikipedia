-- KEYS:
-- 1 = aliveKey
-- 2 = initializedKey
-- 3 = startArticleKey
-- 4 = targetArticleKey
-- 5 = visitedKey 
-- 6 = parentKey 
-- 7 = depthKey 
-- 8 = frontierKey (ZSET) 
-- 9 = statsKey 

-- ARGV:
-- 1 = startArticle
-- 2 = startScore
-- 3 = targetArticle

if redis.call("EXISTS", KEYS[1]) == 0 then
  return 0
end

-- Only one worker initializes
if redis.call("SET", KEYS[2], "1", "NX") == false then
  return 0
end

redis.call("HSET", KEYS[3], "startArticle", ARGV[1])
redis.call("HSET", KEYS[4], "targetArticle", ARGV[3])
redis.call("SADD", KEYS[5], ARGV[1])
redis.call("HSET", KEYS[6], ARGV[1], "")
redis.call("HSET", KEYS[7], ARGV[1], 0)
redis.call("ZADD", KEYS[8], ARGV[2], ARGV[1])
redis.call("HSET", KEYS[9], "totalExpanded", 0)

return 1