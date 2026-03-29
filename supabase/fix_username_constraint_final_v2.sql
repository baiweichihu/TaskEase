-- 修复用户名约束脚本（最终版）
-- 在 Supabase SQL 编辑器中执行此脚本

-- 1. 删除所有可能存在的旧约束
DO $$
BEGIN
    -- 删除可能存在的旧约束
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_username_check' 
        AND table_name = 'profiles'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles DROP CONSTRAINT profiles_username_check;
        RAISE NOTICE '已删除约束: profiles_username_check';
    END IF;
    
    -- 删除可能存在的其他约束
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE 'profiles_username%' 
        AND table_name = 'profiles'
        AND table_schema = 'public'
    ) THEN
        EXECUTE 'ALTER TABLE public.profiles DROP CONSTRAINT ' || 
                (SELECT constraint_name FROM information_schema.table_constraints 
                 WHERE constraint_name LIKE 'profiles_username%' 
                 AND table_name = 'profiles' 
                 AND table_schema = 'public' LIMIT 1);
        RAISE NOTICE '已删除约束: %', 
            (SELECT constraint_name FROM information_schema.table_constraints 
             WHERE constraint_name LIKE 'profiles_username%' 
             AND table_name = 'profiles' 
             AND table_schema = 'public' LIMIT 1);
    END IF;
    
EXCEPTION
    WHEN others THEN
        -- 如果删除失败，继续执行
        RAISE NOTICE '删除约束时出错: %', SQLERRM;
END $$;

-- 2. 添加正确的约束（1-15个字符，支持任意字符）
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_username_check 
CHECK (char_length(username) >= 1 AND char_length(username) <= 15);

-- 3. 验证约束（使用正确的系统表）
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    consrc as check_condition
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass
AND contype = 'c';

-- 4. 检查约束详情
SELECT 
    tc.table_schema,
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_name = 'profiles' 
AND tc.table_schema = 'public'
AND tc.constraint_type = 'CHECK';

-- 5. 测试约束
DO $$
DECLARE
    test_username text;
    test_user_id uuid;
BEGIN
    -- 生成测试用户ID
    test_user_id := gen_random_uuid();
    
    -- 测试有效用户名
    test_username := 'testuser';
    RAISE NOTICE '测试有效用户名: % (长度: %)', test_username, char_length(test_username);
    
    BEGIN
        INSERT INTO public.profiles (user_id, username) VALUES (test_user_id, test_username);
        RAISE NOTICE '有效用户名测试: 成功';
        DELETE FROM public.profiles WHERE user_id = test_user_id;
    EXCEPTION
        WHEN others THEN
            RAISE NOTICE '有效用户名测试: 失败 - %', SQLERRM;
    END;
    
    -- 测试无效用户名（长度0）
    test_username := '';
    RAISE NOTICE '测试空用户名: % (长度: %) - 应该失败', test_username, char_length(test_username);
    
    BEGIN
        INSERT INTO public.profiles (user_id, username) VALUES (test_user_id, test_username);
        RAISE NOTICE '空用户名测试: 意外成功';
        DELETE FROM public.profiles WHERE user_id = test_user_id;
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE '空用户名测试: 正确失败 (check_violation)';
        WHEN others THEN
            RAISE NOTICE '空用户名测试: 失败 - %', SQLERRM;
    END;
    
    -- 测试无效用户名（长度16）
    test_username := '1234567890123456';
    RAISE NOTICE '测试长用户名: % (长度: %) - 应该失败', test_username, char_length(test_username);
    
    BEGIN
        INSERT INTO public.profiles (user_id, username) VALUES (test_user_id, test_username);
        RAISE NOTICE '长用户名测试: 意外成功';
        DELETE FROM public.profiles WHERE user_id = test_user_id;
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE '长用户名测试: 正确失败 (check_violation)';
        WHEN others THEN
            RAISE NOTICE '长用户名测试: 失败 - %', SQLERRM;
    END;
    
    -- 测试边界值：1个字符
    test_username := 'a';
    RAISE NOTICE '测试单字符用户名: % (长度: %) - 应该成功', test_username, char_length(test_username);
    
    BEGIN
        INSERT INTO public.profiles (user_id, username) VALUES (test_user_id, test_username);
        RAISE NOTICE '单字符用户名测试: 成功';
        DELETE FROM public.profiles WHERE user_id = test_user_id;
    EXCEPTION
        WHEN others THEN
            RAISE NOTICE '单字符用户名测试: 失败 - %', SQLERRM;
    END;
    
    -- 测试边界值：15个字符
    test_username := '123456789012345';
    RAISE NOTICE '测试15字符用户名: % (长度: %) - 应该成功', test_username, char_length(test_username);
    
    BEGIN
        INSERT INTO public.profiles (user_id, username) VALUES (test_user_id, test_username);
        RAISE NOTICE '15字符用户名测试: 成功';
        DELETE FROM public.profiles WHERE user_id = test_user_id;
    EXCEPTION
        WHEN others THEN
            RAISE NOTICE '15字符用户名测试: 失败 - %', SQLERRM;
    END;
    
END $$;

-- 完成消息
SELECT '用户名约束修复完成！' AS message;