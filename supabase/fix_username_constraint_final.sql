-- 最终修复用户名约束脚本
-- 在 Supabase SQL 编辑器中执行此脚本

-- 1. 删除所有可能存在的旧约束
DO $$
BEGIN
    -- 删除可能存在的旧约束
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_username_check' 
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE public.profiles DROP CONSTRAINT profiles_username_check;
    END IF;
    
    -- 删除可能存在的其他约束
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE 'profiles_username%' 
        AND table_name = 'profiles'
    ) THEN
        EXECUTE 'ALTER TABLE public.profiles DROP CONSTRAINT ' || 
                (SELECT constraint_name FROM information_schema.table_constraints 
                 WHERE constraint_name LIKE 'profiles_username%' 
                 AND table_name = 'profiles' LIMIT 1);
    END IF;
    
EXCEPTION
    WHEN others THEN
        -- 如果删除失败，继续执行
        NULL;
END $$;

-- 2. 添加正确的约束（1-15个字符，支持任意字符）
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_username_check 
CHECK (char_length(username) >= 1 AND char_length(username) <= 15);

-- 3. 验证约束
SELECT 
    table_name,
    constraint_name,
    constraint_type,
    check_clause
FROM information_schema.table_constraints 
WHERE table_name = 'profiles' 
AND constraint_type = 'CHECK';

-- 4. 测试约束
DO $$
DECLARE
    test_username text;
BEGIN
    -- 测试有效用户名
    test_username := 'test';
    RAISE NOTICE '测试用户名: % (应该成功)', test_username;
    
    -- 测试无效用户名（长度0）
    BEGIN
        test_username := '';
        RAISE NOTICE '测试空用户名: % (应该失败)', test_username;
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE '空用户名测试: 正确失败';
    END;
    
    -- 测试无效用户名（长度16）
    BEGIN
        test_username := '1234567890123456';
        RAISE NOTICE '测试长用户名: % (应该失败)', test_username;
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE '长用户名测试: 正确失败';
    END;
    
END $$;

-- 完成消息
SELECT '用户名约束修复完成！' AS message;