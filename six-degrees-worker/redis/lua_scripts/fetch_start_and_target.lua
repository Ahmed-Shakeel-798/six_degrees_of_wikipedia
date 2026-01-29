-- KEYS:
-- 1 = startArticleKey
-- 2 = targetArticleKey

local startArticle = redis.call("HGET", KEYS[1], "startArticle")
local targetArticle = redis.call("HGET", KEYS[2], "targetArticle")  

return { startArticle, targetArticle }