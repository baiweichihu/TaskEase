import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { ModalShell } from "./ModalShell";

const SUPABASE_URL = "https://ccfmbcvlmlvirkattqnv.supabase.co";
const SUPABASE_KEY = "sb_publishable_XO9o2kqTKkcnHmGEqCmOoQ_vcNyBGk9";
const PROFILE_TABLE = "profiles";

export function DatabaseDiagnostic({ isOpen, onClose, user }) {
  const [diagnostics, setDiagnostics] = useState({
    connection: "pending",
    tableExists: "pending",
    rlsPolicies: "pending",
    userAccess: "pending",
    testQuery: "pending"
  });
  const [details, setDetails] = useState({});

  const runDiagnostics = useCallback(async () => {
    if (!user?.id) return;
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    // 1. 测试连接
    setDiagnostics(prev => ({ ...prev, connection: "testing" }));
    try {
      const { error } = await supabase.from(PROFILE_TABLE).select("count").limit(1);
      if (error) throw error;
      setDiagnostics(prev => ({ ...prev, connection: "success" }));
      setDetails(prev => ({ ...prev, connection: "连接成功" }));
    } catch (error) {
      setDiagnostics(prev => ({ ...prev, connection: "failed" }));
      setDetails(prev => ({ ...prev, connection: `连接失败: ${error.message}` }));
    }

    // 2. 检查表是否存在
    setDiagnostics(prev => ({ ...prev, tableExists: "testing" }));
    try {
      const { data, error } = await supabase
        .from("information_schema.tables")
        .select("table_name")
        .eq("table_schema", "public")
        .eq("table_name", "profiles");
      
      if (error) throw error;
      const exists = data && data.length > 0;
      setDiagnostics(prev => ({ ...prev, tableExists: exists ? "success" : "failed" }));
      setDetails(prev => ({ 
        ...prev, 
        tableExists: exists ? "profiles表存在" : "profiles表不存在" 
      }));
    } catch (error) {
      setDiagnostics(prev => ({ ...prev, tableExists: "failed" }));
      setDetails(prev => ({ ...prev, tableExists: `检查失败: ${error.message}` }));
    }

    // 3. 检查RLS策略
    setDiagnostics(prev => ({ ...prev, rlsPolicies: "testing" }));
    try {
      const { data, error } = await supabase
        .from("information_schema.table_privileges")
        .select("privilege_type")
        .eq("table_schema", "public")
        .eq("table_name", "profiles")
        .eq("grantee", "authenticated");
      
      if (error) throw error;
      const hasPolicies = data && data.length > 0;
      setDiagnostics(prev => ({ ...prev, rlsPolicies: hasPolicies ? "success" : "failed" }));
      setDetails(prev => ({ 
        ...prev, 
        rlsPolicies: hasPolicies ? "RLS策略存在" : "RLS策略缺失" 
      }));
    } catch (error) {
      setDiagnostics(prev => ({ ...prev, rlsPolicies: "failed" }));
      setDetails(prev => ({ ...prev, rlsPolicies: `检查失败: ${error.message}` }));
    }

    // 4. 检查用户访问权限
    setDiagnostics(prev => ({ ...prev, userAccess: "testing" }));
    try {
      const { data, error } = await supabase
        .from(PROFILE_TABLE)
        .select("username")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) {
        if (error.code === "42501") {
          setDiagnostics(prev => ({ ...prev, userAccess: "failed" }));
          setDetails(prev => ({ ...prev, userAccess: "权限不足 (RLS拒绝)" }));
        } else {
          throw error;
        }
      } else {
        setDiagnostics(prev => ({ ...prev, userAccess: "success" }));
        setDetails(prev => ({ 
          ...prev, 
          userAccess: data ? "用户有访问权限" : "用户无数据记录" 
        }));
      }
    } catch (error) {
      setDiagnostics(prev => ({ ...prev, userAccess: "failed" }));
      setDetails(prev => ({ ...prev, userAccess: `检查失败: ${error.message}` }));
    }

    // 5. 测试查询操作
    setDiagnostics(prev => ({ ...prev, testQuery: "testing" }));
    try {
      const testUsername = `test_${Date.now()}`;
      const { error } = await supabase
        .from(PROFILE_TABLE)
        .upsert({ 
          user_id: user.id, 
          username: testUsername 
        })
        .select("username")
        .single();
      
      if (error) throw error;
      
      // 清理测试数据
      await supabase
        .from(PROFILE_TABLE)
        .delete()
        .eq("user_id", user.id)
        .eq("username", testUsername);
      
      setDiagnostics(prev => ({ ...prev, testQuery: "success" }));
      setDetails(prev => ({ ...prev, testQuery: "查询操作正常" }));
    } catch (error) {
      setDiagnostics(prev => ({ ...prev, testQuery: "failed" }));
      setDetails(prev => ({ 
        ...prev, 
        testQuery: `测试失败: ${error.message} (代码: ${error.code})` 
      }));
    }
  }, [user?.id]);

  useEffect(() => {
    if (!isOpen || !user) return;
    void runDiagnostics();
  }, [isOpen, user, runDiagnostics]);

  const getStatusColor = (status) => {
    switch (status) {
      case "success": return "text-success";
      case "failed": return "text-danger";
      case "testing": return "text-warning";
      default: return "text-secondary";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "success": return "✓";
      case "failed": return "✗";
      case "testing": return "⏳";
      default: return "?";
    }
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} backdropZIndex={1060} modalZIndex={1070}>
      {(requestClose) => (
        <div className="modal-dialog" style={{ marginTop: "60px" }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title fs-6">数据库诊断工具</h2>
              <button type="button" className="btn-close" onClick={requestClose} />
            </div>
            <div className="modal-body">
              <div className="d-grid gap-3">
                {Object.entries(diagnostics).map(([key, status]) => (
                  <div key={key} className="d-flex justify-content-between align-items-center">
                    <span>
                      <strong>{key}:</strong> {details[key] || "检查中..."}
                    </span>
                    <span className={getStatusColor(status)}>
                      {getStatusText(status)}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="mt-3 p-3 bg-light rounded">
                <h6 className="mb-2">诊断说明：</h6>
                <ul className="small mb-0">
                  <li><strong>connection:</strong> 测试Supabase连接是否正常</li>
                  <li><strong>tableExists:</strong> 检查profiles表是否存在</li>
                  <li><strong>rlsPolicies:</strong> 检查RLS行级安全策略</li>
                  <li><strong>userAccess:</strong> 检查当前用户访问权限</li>
                  <li><strong>testQuery:</strong> 测试实际的查询操作</li>
                </ul>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={runDiagnostics}
              >
                重新诊断
              </button>
              <button type="button" className="btn btn-secondary" onClick={requestClose}>
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalShell>
  );
}